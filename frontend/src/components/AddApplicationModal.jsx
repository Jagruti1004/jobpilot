import { Modal, Form, Input, Button, message, Tabs, Space, Tag, Alert, Spin } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { applicationApi } from '../api/applications.js';

export const AddApplicationModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState([]); // skillsRequired as a separate state since it's an array
  const [usedFallback, setUsedFallback] = useState(false);

  // Reset everything on close
  const handleClose = () => {
    form.resetFields();
    setSkills([]);
    setUsedFallback(false);
    setParsing(false);
    setSaving(false);
    onClose();
  };

  // Step 1: User pastes a URL → call backend → prefill form
  const handleParseUrl = async () => {
    const url = form.getFieldValue('sourceUrl');
    if (!url || !url.startsWith('http')) {
      message.error('Enter a valid URL starting with http:// or https://');
      return;
    }
    setParsing(true);
    setUsedFallback(false);
    try {
      const parsed = await applicationApi.parseLink(url);
      form.setFieldsValue({
        company: parsed.company || '',
        role: parsed.role || '',
        location: parsed.location || '',
        experienceRequired: parsed.experienceRequired || '',
        description: parsed.description || '',
      });
      setSkills(parsed.skillsRequired || []);
      if (parsed._mock) {
        setUsedFallback(true);
        message.warning('Could not auto-extract — please fill in manually.');
      } else {
        message.success('Job details extracted!');
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to parse URL');
      setUsedFallback(true);
    } finally {
      setParsing(false);
    }
  };

  // Step 2: User clicks Save → create application
  const handleSave = async (values) => {
    setSaving(true);
    try {
      const created = await applicationApi.create({
        ...values,
        skillsRequired: skills,
        status: 'SAVED',
      });
      message.success('Application added');
      onCreated(created);
      handleClose();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Add Application"
      onCancel={handleClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Spin spinning={parsing} tip="Extracting job details with AI...">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* URL input + Parse button */}
          <Form.Item
            name="sourceUrl"
            label="Job link (optional — paste to auto-fill)"
          >
            <Input
              placeholder="https://jobs.example.com/..."
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={handleParseUrl}
                  disabled={parsing}
                  style={{ padding: 0 }}
                >
                  Parse
                </Button>
              }
            />
          </Form.Item>

          {usedFallback && (
            <Alert
              type="warning"
              showIcon
              message="Auto-extract didn't work for this URL"
              description="Some sites (LinkedIn, Workday, Indeed) block automated parsing. Just fill in the fields below manually."
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="company"
            label="Company"
            rules={[{ required: true, message: 'Company is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Role is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. Remote, San Francisco" />
          </Form.Item>

          <Form.Item name="experienceRequired" label="Experience required">
            <Input placeholder="e.g. 3-5 years, Entry level" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Skills required">
            {skills.length > 0 ? (
              <Space size={[8, 8]} wrap>
                {skills.map((s, i) => (
                  <Tag
                    key={i}
                    closable
                    color="blue"
                    onClose={() => setSkills(skills.filter((_, idx) => idx !== i))}
                  >
                    {s}
                  </Tag>
                ))}
              </Space>
            ) : (
              <span style={{ color: '#999' }}>No skills extracted</span>
            )}
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save
            </Button>
          </Space>
        </Form>
      </Spin>
    </Modal>
  );
};