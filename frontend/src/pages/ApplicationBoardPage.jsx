import { useEffect, useState } from 'react';
import { Typography, Button, Spin, message, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { applicationApi } from '../api/applications.js';
import { ApplicationColumn } from '../components/ApplicationColumn.jsx';
import { ApplicationCard } from '../components/ApplicationCard.jsx';
import { AddApplicationModal } from '../components/AddApplicationModal.jsx';

const COLUMNS = [
  { status: 'SAVED', label: 'Saved' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'IN_CONTACT', label: 'In Contact' },
  { status: 'INTERVIEWING', label: 'Interviewing' },
  { status: 'REJECTED', label: 'Rejected' },
  { status: 'OFFER', label: 'Offer' },
];

export const ApplicationBoardPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(null); // ID of the card being dragged

  // Require small drag distance before starting — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fetch applications on mount
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const apps = await applicationApi.list();
      setApplications(apps);
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Group applications by status (memo not needed — list is small)
  const groupByStatus = (apps) => {
    const grouped = {};
    COLUMNS.forEach((c) => {
      grouped[c.status] = [];
    });
    apps.forEach((app) => {
      if (grouped[app.status]) grouped[app.status].push(app);
    });
    return grouped;
  };

  const grouped = groupByStatus(applications);
  const activeApplication = applications.find((a) => a.id === activeId);

  // Drag start: just remember which card is being dragged (for the drag overlay)
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Drag end: figure out where the card landed and update both UI + backend
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return; // Dropped outside any droppable

    const draggedApp = applications.find((a) => a.id === active.id);
    if (!draggedApp) return;

    // Determine target column. `over.id` is either:
    //   - a column status string (dropped on empty area of a column), OR
    //   - another card's id (dropped on top of a card)
    let targetStatus;
    let targetIndex;

    const overIsColumn = COLUMNS.some((c) => c.status === over.id);

    if (overIsColumn) {
      targetStatus = over.id;
      targetIndex = grouped[targetStatus].length; // Append to end
    } else {
      // Dropped onto a specific card — find that card's column
      const overApp = applications.find((a) => a.id === over.id);
      if (!overApp) return;
      targetStatus = overApp.status;
      targetIndex = grouped[targetStatus].findIndex((a) => a.id === over.id);
    }

    // No-op if nothing changed
    if (draggedApp.status === targetStatus && draggedApp.id === over.id) return;

    // Optimistic UI update — move the card immediately, sync with backend after
    const updated = [...applications];
    const draggedIndex = updated.findIndex((a) => a.id === active.id);
    updated[draggedIndex] = { ...draggedApp, status: targetStatus };

    // If we reordered within the same column, use arrayMove to be precise
    if (draggedApp.status === targetStatus && !overIsColumn) {
      const sourceIdx = grouped[targetStatus].findIndex((a) => a.id === active.id);
      const reordered = arrayMove(grouped[targetStatus], sourceIdx, targetIndex);
      // Replace the column's items in the full array
      const otherCols = updated.filter((a) => a.status !== targetStatus || a.id !== active.id);
      const merged = [
        ...otherCols.filter((a) => a.status !== targetStatus),
        ...reordered.map((a) => (a.id === active.id ? { ...a, status: targetStatus } : a)),
      ];
      setApplications(merged);
    } else {
      setApplications(updated);
    }

    // Persist to backend
    try {
      await applicationApi.updateStatus(active.id, targetStatus, targetIndex);
    } catch (err) {
      message.error('Failed to save change — refreshing');
      fetchApplications(); // Roll back to server truth
    }
  };

  const handleCardDeleted = (id) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const handleApplicationCreated = (newApp) => {
    setApplications((prev) => [...prev, newApp]);
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
      {/* Header */}
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Applications
        </Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchApplications}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add Application
          </Button>
        </Space>
      </Space>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
          }}
        >
          {COLUMNS.map((col) => (
            <ApplicationColumn
              key={col.status}
              status={col.status}
              label={col.label}
              applications={grouped[col.status]}
              onCardDeleted={handleCardDeleted}
            />
          ))}
        </div>

        {/* DragOverlay shows the card following the cursor while dragging */}
        <DragOverlay>
          {activeApplication ? (
            <ApplicationCard application={activeApplication} onDeleted={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddApplicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleApplicationCreated}
      />
    </div>
  );
};