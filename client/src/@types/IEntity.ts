export interface IProject {
  id: number;
  clientId: string;
  name: string;
  tickets : ITicket[];
}

export interface ITicket {
  code: string;
  id: number;
  tasks: ITasks[]
}

export interface ITasks {
  taskCode: string;
  id: number;
}

export interface IEntity {
  label: string;
  value: number;
  isParent?: boolean;
  entityType: string;
  clientId: string;
  projectId: number;
}
