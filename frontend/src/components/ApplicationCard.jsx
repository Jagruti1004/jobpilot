import { Card, Tag, Tooltip, Dropdown, Button, message, Modal } from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  MoreOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { applicationApi } from '../api/applications.js';

export const ApplicationCard = ({ application, onDeleted }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { type: 'application', status: application.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    marginBottom: 12,
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete this application?',
      content: `${application.role} at ${application.company}`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await applicationApi.remove(application.id);
          message.success('Deleted');
          onDeleted(application.id);
        } catch (err) {
          message.error(err.response?.data?.error || 'Failed to delete');
        }
      },
    });
  };

  const formatDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const skills = Array.isArray(application.skillsRequired) ? application.skillsRequired : [];

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        hoverable
        bodyStyle={{ padding: 12 }}
        {...attributes}
        {...listeners}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
              {application.role}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>{application.company}</div>
          </div>

          <div onPointerDown={(e) => e.stopPropagation()}>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    label: 'Delete',
                    onClick: handleDelete,
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        </div>

        {(application.location || application.appliedDate) && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#888' }}>
            {application.location && (
              <span>
                <EnvironmentOutlined /> {application.location}
              </span>
            )}
            {application.appliedDate && (
              <span>
                <ClockCircleOutlined /> {formatDate(application.appliedDate)}
              </span>
            )}
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {skills.slice(0, 4).map((s, i) => (
              <Tag key={i} style={{ fontSize: 11, margin: 0 }}>
                {s}
              </Tag>
            ))}
            {skills.length > 4 && (
              <Tag style={{ fontSize: 11, margin: 0 }}>+{skills.length - 4}</Tag>
            )}
          </div>
        )}

        {(application.sourceUrl || application.matchScore != null) && (
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            {application.sourceUrl ? (
              <Tooltip title="Open job posting">
                <a
                  href={application.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#1677ff' }}
                >
                  <LinkOutlined /> Source
                </a>
              </Tooltip>
            ) : (
              <span />
            )}
            {application.matchScore != null && (
              <Tag color={application.matchScore >= 70 ? 'green' : application.matchScore >= 40 ? 'orange' : 'red'}>
                {application.matchScore}% match
              </Tag>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};