import { Form, Input, Button, Card, message, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { resumeApi } from '../api/resume.js';

export const ResumeProfileForm = ({ resume, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Whenever the parent passes a new resume, populate the form
  useEffect(() => {
    if (resume) {
      form.setFieldsValue({
        name: resume.name || '',
        email: resume.email || '',
        phone: resume.phone || '',
        location: resume.location || '',
        linkedin: resume.linkedin || '',
        github: resume.github || '',
        portfolio: resume.portfolio || '',
      });
    }
  }, [resume, form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      // Keep arrays as-is from the parsed resume; only contact fields are editable here
      const updated = await resumeApi.update({
        ...values,
        skills: resume.skills,
        experience: resume.experience,
        education: resume.education,
        projects: resume.projects,
      });
      message.success('Resume saved');
      onSaved?.(updated);
    } catch (err) {
      message.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Helper to safely render JSON arrays even if backend returned null
  const skills = Array.isArray(resume?.skills) ? resume.skills : [];
  const experience = Array.isArray(resume?.experience) ? resume.experience : [];
  const education = Array.isArray(resume?.education) ? resume.education : [];
  const projects = Array.isArray(resume?.projects) ? resume.projects : [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Contact Information">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input />
          </Form.Item>
          <Form.Item name="linkedin" label="LinkedIn">
            <Input />
          </Form.Item>
          <Form.Item name="github" label="GitHub">
            <Input />
          </Form.Item>
          <Form.Item name="portfolio" label="Portfolio">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save changes
          </Button>
        </Form>
      </Card>

      <Card title="Skills">
        {skills.length === 0 ? (
          <span style={{ color: '#999' }}>No skills detected</span>
        ) : (
          <Space size={[8, 8]} wrap>
            {skills.map((s, i) => (
              <Tag key={i} color="blue">{s}</Tag>
            ))}
          </Space>
        )}
      </Card>

      <Card title="Experience">
        {experience.length === 0 ? (
          <span style={{ color: '#999' }}>No experience detected</span>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {experience.map((e, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600 }}>
                  {e.role} {e.company && `· ${e.company}`}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>{e.duration}</div>
                {e.description && <div style={{ marginTop: 4 }}>{e.description}</div>}
              </div>
            ))}
          </Space>
        )}
      </Card>

      <Card title="Education">
        {education.length === 0 ? (
          <span style={{ color: '#999' }}>No education detected</span>
        ) : (
          <Space direction="vertical">
            {education.map((e, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600 }}>{e.degree}</div>
                <div style={{ color: '#666', fontSize: 13 }}>
                  {e.school} {e.year && `· ${e.year}`}
                </div>
              </div>
            ))}
          </Space>
        )}
      </Card>

      <Card title="Projects">
        {projects.length === 0 ? (
          <span style={{ color: '#999' }}>No projects detected</span>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {projects.map((p, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                {p.description && <div>{p.description}</div>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer">
                    {p.link}
                  </a>
                )}
              </div>
            ))}
          </Space>
        )}
      </Card>
    </Space>
  );
};