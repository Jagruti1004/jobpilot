import { Upload, message, Alert, Spin } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import { resumeApi } from "../api/resume.js";

const { Dragger } = Upload;

export const ResumeUpload = ({ onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [mockNotice, setMockNotice] = useState(false);

  // beforeUpload returning false prevents antd from auto-uploading;
  // we handle the upload manually so we control everything.
  const beforeUpload = async (file) => {
    if (file.type !== "application/pdf") {
      message.error("Only PDF files are supported");
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    setMockNotice(false);
    try {
      const { resume, isMock } = await resumeApi.upload(file);
      setMockNotice(isMock);
      message.success("Resume parsed successfully!");
      onUploaded(resume);
    } catch (err) {
      const msg = err.response?.data?.error || "Upload failed";
      message.error(msg);
    } finally {
      setUploading(false);
    }

    return Upload.LIST_IGNORE; // Prevent antd from showing the file in its internal list
  };

  return (
    <div>
      {mockNotice && (
        <Alert
          type="warning"
          showIcon
          message="AI parsing unavailable"
          description="The AI service didn't respond, so the resume couldn't be auto-filled. You can enter your details manually below, or try uploading again."
          style={{ marginBottom: 16 }}
        />
      )}
      <Spin spinning={uploading} tip="Parsing your resume with AI...">
        <Dragger
          accept="application/pdf"
          multiple={false}
          showUploadList={false}
          beforeUpload={beforeUpload}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag your resume PDF here</p>
          <p className="ant-upload-hint">
            We'll extract your info using AI. Max file size: 10 MB.
          </p>
        </Dragger>
      </Spin>
    </div>
  );
};
