import React from 'react';
import { Text } from 'react-native';

interface NamedTarget {
  id: string;
  name: string;
}

export function buildTargets(metadata: Record<string, any>): NamedTarget[] {
  const targetIds: string[] = Array.isArray(metadata.targetIds) ? metadata.targetIds : [];
  const payload: Record<string, any> = metadata.payload ?? {};
  const targetNames: string[] = Array.isArray(payload.targetNames) ? payload.targetNames : [];
  const targetName: string = payload.targetName ? String(payload.targetName) : '';

  if (targetIds.length === 0) return [];

  return targetIds.map((id, i) => ({
    id,
    name: targetNames[i] ?? targetName ?? 'Người dùng',
  }));
}

export function formatSystemMessageAsText(metadata?: Record<string, any> | null): string {
  if (!metadata) return '[Thông báo]';
  const action = String(metadata.action ?? '');
  const actorName = String(metadata.actorName ?? 'Ai đó');
  const payload: Record<string, any> = metadata.payload ?? {};
  const newName: string = payload.newName ? String(payload.newName) : '';
  const targets = buildTargets(metadata);
  const targetsText = targets.length > 0 ? targets.map(t => t.name).join(', ') : 'thành viên';

  switch (action) {
    case 'CREATE_GROUP': return `${actorName} đã tạo nhóm`;
    case 'ADD_MEMBERS': return `${actorName} đã thêm ${targetsText} vào nhóm`;
    case 'REMOVE_MEMBER': return `${actorName} đã xóa ${targetsText} khỏi nhóm`;
    case 'LEAVE_GROUP': return `${actorName} đã rời nhóm`;
    case 'UPDATE_NAME': return newName ? `${actorName} đã đổi tên nhóm thành "${newName}"` : `${actorName} đã đổi tên nhóm`;
    case 'UPDATE_AVATAR': return `${actorName} đã đổi ảnh đại diện nhóm`;
    case 'DISBAND_GROUP': return `${actorName} đã giải tán nhóm`;
    case 'PROMOTE_ADMIN': return `${actorName} đã cấp quyền Admin cho ${targetsText}`;
    case 'DEMOTE_ADMIN': return `${actorName} đã thu hồi quyền Admin của ${targetsText}`;
    case 'TRANSFER_OWNER': return `${actorName} đã chuyển quyền trưởng nhóm cho ${targetsText}`;
    case 'JOIN_BY_LINK': return `${actorName} đã tham gia nhóm qua link mời`;
    case 'GENERATE_JOIN_LINK': return `${actorName} đã tạo link tham gia nhóm`;
    case 'REFRESH_JOIN_LINK': return `${actorName} đã làm mới link tham gia nhóm`;
    case 'PIN_MESSAGE': return `${actorName} đã ghim một tin nhắn`;
    case 'UNPIN_MESSAGE': return `${actorName} đã bỏ ghim một tin nhắn`;
    case 'JOIN_REQUEST_CREATED': return `${actorName} đã gửi yêu cầu tham gia nhóm`;
    case 'JOIN_REQUEST_APPROVED': return `${targets.length > 0 ? targetsText : actorName} đã được chấp nhận vào nhóm`;
    case 'JOIN_REQUEST_REJECTED': return `Yêu cầu tham gia của ${targets.length > 0 ? targetsText : actorName} đã bị từ chối`;
    case 'BLOCK_MEMBER': return `${actorName} đã chặn ${targetsText} khỏi nhóm`;
    case 'BLOCKED_FROM_JOINING': return `Một thành viên đã bị chặn tham gia nhóm`;
    case 'UPDATE_SETTINGS': {
      const setting = payload.setting as string | undefined;
      const value = payload.value;
      if (setting === 'memberCanSendMessages') return value ? `${actorName} đã cho phép tất cả thành viên nhắn tin` : `${actorName} đã tắt quyền nhắn tin của thành viên`;
      if (setting === 'membershipApprovalEnabled') return value ? `${actorName} đã bật xét duyệt thành viên` : `${actorName} đã tắt xét duyệt thành viên`;
      if (setting === 'joinByLinkEnabled') return value ? `${actorName} đã bật link mời` : `${actorName} đã tắt link mời`;
      return `${actorName} đã cập nhật cài đặt nhóm`;
    }
    case 'ADD_MEMBERS_FAILED': return `Không thể thêm một số thành viên vào nhóm`;
    default: return `${actorName} đã thực hiện một thao tác`;
  }
}

export function renderSystemMessage(metadata?: Record<string, any> | null): React.ReactNode {
  if (!metadata) return null;

  const action = String(metadata.action ?? '');
  const actorName = String(metadata.actorName ?? 'Ai đó');
  const payload: Record<string, any> = metadata.payload ?? {};
  const newName: string = payload.newName ? String(payload.newName) : '';
  const targets = buildTargets(metadata);

  const Actor = <Text style={{ fontWeight: '600', color: '#374151' }}>{actorName}</Text>;
  const Targets = targets.length > 0 
    ? <Text style={{ fontWeight: '600', color: '#374151' }}>{targets.map(t => t.name).join(', ')}</Text>
    : <Text>thành viên</Text>;

  switch (action) {
    case 'CREATE_GROUP': return <Text>{Actor} đã tạo nhóm</Text>;
    case 'ADD_MEMBERS': return <Text>{Actor} đã thêm {Targets} vào nhóm</Text>;
    case 'REMOVE_MEMBER': return <Text>{Actor} đã xóa {Targets} khỏi nhóm</Text>;
    case 'LEAVE_GROUP': return <Text>{Actor} đã rời nhóm</Text>;
    case 'UPDATE_NAME': return newName ? <Text>{Actor} đã đổi tên nhóm thành <Text style={{ fontWeight: '600', color: '#374151' }}>"{newName}"</Text></Text> : <Text>{Actor} đã đổi tên nhóm</Text>;
    case 'UPDATE_AVATAR': return <Text>{Actor} đã đổi ảnh đại diện nhóm</Text>;
    case 'DISBAND_GROUP': return <Text>{Actor} đã giải tán nhóm</Text>;
    case 'PROMOTE_ADMIN': return <Text>{Actor} đã cấp quyền Admin cho {Targets}</Text>;
    case 'DEMOTE_ADMIN': return <Text>{Actor} đã thu hồi quyền Admin của {Targets}</Text>;
    case 'TRANSFER_OWNER': return <Text>{Actor} đã chuyển quyền trưởng nhóm cho {Targets}</Text>;
    case 'JOIN_BY_LINK': return <Text>{Actor} đã tham gia nhóm qua link mời</Text>;
    case 'GENERATE_JOIN_LINK': return <Text>{Actor} đã tạo link tham gia nhóm</Text>;
    case 'REFRESH_JOIN_LINK': return <Text>{Actor} đã làm mới link tham gia nhóm</Text>;
    case 'PIN_MESSAGE': return <Text>{Actor} đã ghim một tin nhắn</Text>;
    case 'UNPIN_MESSAGE': return <Text>{Actor} đã bỏ ghim một tin nhắn</Text>;
    case 'JOIN_REQUEST_CREATED': return <Text>{Actor} đã gửi yêu cầu tham gia nhóm</Text>;
    case 'JOIN_REQUEST_APPROVED': return <Text>{targets.length > 0 ? Targets : Actor} đã được chấp nhận vào nhóm</Text>;
    case 'JOIN_REQUEST_REJECTED': return <Text>Yêu cầu tham gia của {targets.length > 0 ? Targets : Actor} đã bị từ chối</Text>;
    case 'BLOCK_MEMBER': return <Text>{Actor} đã chặn {Targets} khỏi nhóm</Text>;
    case 'BLOCKED_FROM_JOINING': return <Text>Một thành viên đã bị chặn tham gia nhóm</Text>;
    case 'UPDATE_SETTINGS': {
      const setting = payload.setting as string | undefined;
      const value = payload.value;
      if (setting === 'memberCanSendMessages') {
        return value
          ? <Text>{Actor} đã <Text style={{ fontWeight: '600', color: '#059669' }}>cho phép</Text> tất cả thành viên nhắn tin</Text>
          : <Text>{Actor} đã <Text style={{ fontWeight: '600', color: '#ef4444' }}>tắt</Text> quyền nhắn tin của thành viên</Text>;
      }
      if (setting === 'membershipApprovalEnabled') {
        return value
          ? <Text>{Actor} đã bật <Text style={{ fontWeight: '600' }}>xét duyệt thành viên</Text></Text>
          : <Text>{Actor} đã tắt <Text style={{ fontWeight: '600' }}>xét duyệt thành viên</Text></Text>;
      }
      if (setting === 'joinByLinkEnabled') {
        return value
          ? <Text>{Actor} đã bật <Text style={{ fontWeight: '600' }}>link mời</Text></Text>
          : <Text>{Actor} đã tắt <Text style={{ fontWeight: '600' }}>link mời</Text></Text>;
      }
      return <Text>{Actor} đã cập nhật cài đặt nhóm</Text>;
    }
    case 'ADD_MEMBERS_FAILED': return <Text>Không thể thêm một số thành viên vào nhóm</Text>;
    default: return <Text>{Actor} đã thực hiện một thao tác</Text>;
  }
}
