import { emit } from 'eiphop';

export function getAllUserEntities() {
    return emit('getAllUserEntities');
}

export function changeSelectedEntity(data: { projectId: number, entityId: number | null, entityType: string | null, clientId: string }) {
    return emit('changeSelectedEntity', data);
};
