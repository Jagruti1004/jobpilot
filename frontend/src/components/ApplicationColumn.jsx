import { Card, Badge, Empty } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ApplicationCard } from './ApplicationCard.jsx';

// Column color theme — picks a subtle color per status for the badge
const STATUS_COLORS = {
  SAVED: '#8c8c8c',
  APPLIED: '#1677ff',
  IN_CONTACT: '#722ed1',
  INTERVIEWING: '#fa8c16',
  REJECTED: '#ff4d4f',
  OFFER: '#52c41a',
};

export const ApplicationColumn = ({ status, label, applications, onCardDeleted }) => {
  // useDroppable registers this whole column as a drop target
  const { setNodeRef, isOver } = useDroppable({
    id: status, // The droppable id IS the status — used by the board to know where the card landed
    data: { type: 'column', status },
  });

  return (
    <div style={{ minWidth: 280, flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATUS_COLORS[status],
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </span>
        </div>
        <Badge
          count={applications.length}
          showZero
          style={{ background: '#f0f0f0', color: '#666' }}
        />
      </div>

      {/* Droppable card list */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: 200,
          padding: 8,
          background: isOver ? '#e6f4ff' : '#fafafa',
          borderRadius: 8,
          transition: 'background 0.15s ease',
        }}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ fontSize: 12, color: '#999' }}>No applications</span>}
              />
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onDeleted={onCardDeleted}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};