import { Typography, Spin, Empty, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { resumeApi } from '../api/resume.js';
import { ResumeUpload } from '../components/ResumeUpload.jsx';
import { ResumeProfileForm } from '../components/ResumeProfileForm.jsx';

export const ResumePage = () => {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // On mount, fetch existing resume (if any)
  useEffect(() => {
    resumeApi
      .get()
      .then((r) => {
        setResume(r);
        setShowUpload(!r); // Show uploader if no resume yet
      })
      .catch(() => setShowUpload(true))
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = (r) => {
    setResume(r);
    setShowUpload(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Resume
        </Typography.Title>
        {resume && !showUpload && (
          <Button icon={<ReloadOutlined />} onClick={() => setShowUpload(true)}>
            Upload new resume
          </Button>
        )}
      </Space>

      {showUpload ? (
        <ResumeUpload onUploaded={handleUploaded} />
      ) : resume ? (
        <ResumeProfileForm resume={resume} onSaved={setResume} />
      ) : (
        <Empty description="Upload your resume to get started" />
      )}
    </div>
  );
};