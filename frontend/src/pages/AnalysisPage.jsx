import { useEffect, useState } from 'react';
import {
  Typography, Button, Card, Space, Spin, Empty, Alert, Tag, List, Statistic, Row, Col, Progress,
} from 'antd';
import {
  ThunderboltOutlined, ReloadOutlined, RiseOutlined, AimOutlined,
  WarningOutlined, BulbOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { analysisApi } from '../api/analysis.js';

const VERDICT_COLORS = {
  Excellent: 'green',
  Healthy: 'blue',
  'Needs work': 'orange',
  Critical: 'red',
  Unknown: 'default',
};

const PRIORITY_COLORS = { High: 'red', Medium: 'orange', Low: 'default' };

export const AnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cached analysis on mount
  useEffect(() => {
    analysisApi.get()
      .then(setAnalysis)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const fresh = await analysisApi.generate();
      setAnalysis(fresh);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate analysis');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const report = analysis?.report;
  const isMock = report?._mock === true;

  return (
    <div>
      {/* Header */}
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Analysis Report
        </Typography.Title>
        <Button
          type="primary"
          icon={analysis ? <ReloadOutlined /> : <ThunderboltOutlined />}
          loading={generating}
          onClick={handleGenerate}
        >
          {analysis ? 'Regenerate Analysis' : 'Generate Analysis'}
        </Button>
      </Space>

      {/* Error from generate */}
      {error && (
        <Alert
          type="warning"
          showIcon
          message="Couldn't generate analysis"
          description={error}
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Loading state during generation */}
      {generating && (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" tip="Analyzing your job search with AI..." />
          <div style={{ marginTop: 16, color: '#888' }}>
            This usually takes 5-10 seconds.
          </div>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !generating && (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <Empty
            description={
              <Space direction="vertical" size="small">
                <Typography.Text strong>No analysis yet</Typography.Text>
                <Typography.Text type="secondary">
                  Upload a resume and add at least 3 applications, then click "Generate Analysis".
                </Typography.Text>
              </Space>
            }
          />
        </Card>
      )}

      {/* The report */}
      {analysis && !generating && report && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {isMock && (
            <Alert
              type="warning"
              showIcon
              message="AI is unavailable"
              description="The analysis service didn't respond. The numbers below are accurate, but the qualitative coaching is empty. Try regenerating in a moment."
            />
          )}

          {/* Top-line stats */}
          <Card>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Applied"
                  value={analysis.totalApplied || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Callbacks"
                  value={analysis.totalCallbacks || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Callback Rate"
                  value={((analysis.callbackRate || 0) * 100).toFixed(1)}
                  suffix="%"
                />
              </Col>
            </Row>
            <Progress
              percent={Math.round((analysis.callbackRate || 0) * 100)}
              status={analysis.callbackRate > 0.15 ? 'success' : 'normal'}
              showInfo={false}
              style={{ marginTop: 16 }}
            />
          </Card>

          {/* Callback Health */}
          {report.callbackHealth && (
            <Card title={<Space><RiseOutlined /> Callback Health</Space>}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Tag color={VERDICT_COLORS[report.callbackHealth.verdict] || 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {report.callbackHealth.verdict || 'Unknown'}
                </Tag>
                <Typography.Text>{report.callbackHealth.summary}</Typography.Text>
              </Space>
            </Card>
          )}

          {/* Resume vs Job Match */}
          {report.resumeJobMatch && (
            <Card title={<Space><AimOutlined /> Resume vs Job Match</Space>}>
              <Typography.Paragraph>{report.resumeJobMatch.summary}</Typography.Paragraph>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Typography.Text strong>Strengths</Typography.Text>
                  <List
                    size="small"
                    dataSource={report.resumeJobMatch.strengths || []}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        ✓ {item}
                      </List.Item>
                    )}
                    locale={{ emptyText: 'None identified' }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Typography.Text strong>Gaps</Typography.Text>
                  <List
                    size="small"
                    dataSource={report.resumeJobMatch.gaps || []}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        ⚠ {item}
                      </List.Item>
                    )}
                    locale={{ emptyText: 'None identified' }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Missing Skills */}
          {report.missingSkills?.length > 0 && (
            <Card title={<Space><WarningOutlined /> Missing Skills</Space>}>
              <Space size={[8, 8]} wrap>
                {report.missingSkills.map((s, i) => (
                  <Tag key={i} color={PRIORITY_COLORS[s.priority] || 'default'}>
                    {s.skill} <span style={{ opacity: 0.7 }}>· {s.frequency} jobs · {s.priority}</span>
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* Application Pattern Issues */}
          {report.applicationPatternIssues?.length > 0 && (
            <Card title={<Space><WarningOutlined /> Application Pattern Issues</Space>}>
              <List
                size="small"
                dataSource={report.applicationPatternIssues}
                renderItem={(item) => <List.Item>• {item}</List.Item>}
              />
            </Card>
          )}

          {/* Missing Profile Signals */}
          {report.missingProfileSignals?.length > 0 && (
            <Card title={<Space><BulbOutlined /> Missing Profile Signals</Space>}>
              <List
                size="small"
                dataSource={report.missingProfileSignals}
                renderItem={(item) => <List.Item>• {item}</List.Item>}
              />
            </Card>
          )}

          {/* Best-Fit Role Types */}
          {report.bestFitRoleTypes?.length > 0 && (
            <Card title={<Space><AimOutlined /> Best-Fit Role Types</Space>}>
              <Space size={[8, 8]} wrap>
                {report.bestFitRoleTypes.map((r, i) => (
                  <Tag key={i} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
                    {r}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* 7-Day Action Plan */}
          {report.sevenDayActionPlan?.length > 0 && (
            <Card title={<Space><CalendarOutlined /> 7-Day Action Plan</Space>}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {report.sevenDayActionPlan.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: '3px solid #1677ff',
                      paddingLeft: 12,
                      paddingTop: 4,
                      paddingBottom: 4,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Day {d.day}: {d.action}</div>
                    <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{d.rationale}</div>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Generated {new Date(analysis.updatedAt).toLocaleString()}
          </Typography.Text>
        </Space>
      )}
    </div>
  );
};