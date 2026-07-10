import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Modal, Input, message, Tooltip } from 'antd';
import { Check, X, Edit, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { getPendingMessages, updateMessage } from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import ContentPanel from '../../components/ui/ContentPanel';

const { TextArea } = Input;

interface MessageRow {
  id: string;
  content: string;
  status: string;
  channel: string;
  customer: { name: string };
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MessageRow | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pending-messages'],
    queryFn: getPendingMessages,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, content }: { id: string; status: string; content?: string }) =>
      updateMessage(id, { status, content }),
    onSuccess: () => {
      message.success('Message updated');
      queryClient.invalidateQueries({ queryKey: ['pending-messages'] });
      setEditing(null);
    },
  });

  const messages: MessageRow[] = data?.data ?? [];

  const columns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      width: 140,
      fixed: 'left' as const,
      render: (n: string) => <span className="font-medium text-slate-800">{n}</span>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 110,
      render: (c: string) => <Tag className="!rounded-full !m-0">{c}</Tag>,
    },
    {
      title: 'Message',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 320,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color="warning" className="!rounded-full !m-0">{s}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: MessageRow) => (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Tooltip title="Approve">
            <Button
              type="primary"
              size="small"
              icon={<Check size={14} color="#fff" />}
              className="!rounded-lg !inline-flex !items-center"
              onClick={() => mutation.mutate({ id: record.id, status: 'APPROVED' })}
            >
              Approve
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<Edit size={14} color="#475569" />}
              className="!rounded-lg !inline-flex !items-center !border-slate-300"
              onClick={() => { setEditing(record); setEditContent(record.content); }}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Reject">
            <Button
              danger
              type="primary"
              size="small"
              icon={<X size={14} color="#fff" strokeWidth={2.5} />}
              className="!rounded-lg !inline-flex !items-center"
              onClick={() => mutation.mutate({ id: record.id, status: 'REJECTED' })}
            >
              Reject
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader
        title="Message Approval"
        subtitle="Review and approve AI-generated outreach before sending to customers"
        icon={<MessageSquare size={22} color="#fff" />}
        badge={`${messages.length} pending`}
      />

      <ContentPanel noPadding className="content-panel-scroll">
        <Table
          dataSource={messages}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 960 }}
          size="middle"
        />
      </ContentPanel>

      <Modal
        title="Edit Message"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => editing && mutation.mutate({ id: editing.id, status: 'DRAFT', content: editContent })}
      >
        <TextArea rows={5} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="!rounded-xl" />
      </Modal>
    </div>
  );
}
