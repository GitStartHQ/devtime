import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select } from 'antd';
import { changeSelectedEntity, getAllUserEntities } from '../../services/entities.api';
import classNames from 'classnames';
import styled from 'styled-components';
import { IEntity, IProject, ITasks } from '../../@types/IEntity';

export const SelectContainer = styled(Select)`
  width: 300px;
`;

type Project = { 
  label: string; 
  value: string; 
  clientid: string; 
  projectid: number; 
  entitytype: string | null;
}

const { Option } = Select;

const flattenTasks = (tasks: ITasks[], data: { projectId: number; clientId: string; }): IEntity[] => {
  return tasks.map((task) => {
    return {
      label: task.taskCode,
      value: task.id,
      entityType: 'task',
      ...data
    }
  })
}
const flattenProjectTickets = (project: IProject,  data: { projectId: number; clientId: string; }) => {
    const entities: IEntity[] = [];

    project.tickets.forEach((ticket) => {
      entities.push({ label: ticket.code, value: ticket.id, isParent: true , entityType: 'ticket', ...data })
      const tasks = flattenTasks(ticket.tasks, data);
      entities.push(...tasks);
    });

    return entities;
}

const groupEntities = (projects: IProject[]): { [key: string]: { entities: IEntity[]; data: { projectId: number, clientId: string } } } => {
  const grouped = projects.reduce((acc, project) => {
    const data = { projectId: project.id, clientId: project.clientId };

    acc[project.name] = { entities: flattenProjectTickets(project, data), data }

    return acc;
  }, {})


  return grouped;
}

const useActivities = () => {
  const [entities, setEntities] = useState([]);

  const getActivities = useCallback(async () => {
    const data = await getAllUserEntities();

    setEntities(data)
  }, [])

  useEffect(() => {
    getActivities()
  }, [getActivities])

  return entities;
};

const useGroupedOptions = () => {
  const entities = useActivities();

  return useMemo(() => groupEntities(entities), [entities])
}



const ProjectSelect: React.FC<{
  projects: Project[];
  onSelect: (value: number, data: Project) => void;
}> = ({ projects, onSelect }) => {
  return (
    <SelectContainer
      showSearch
      placeholder="Select a Project"
      onChange={onSelect}
      options={projects}
    />
  )
}

const ProjectEntitySelect: React.FC<{
  entities: IEntity[];
  onSelect: (value: number, data: Project) => void;
  disabled: boolean;
}> = ({ entities, onSelect, disabled }) => {
  return (
    <SelectContainer
      showSearch
      disabled={disabled}
      placeholder="Select Ticket / task"
      onChange={onSelect}
    >
    {entities.map((entity) => {
      return (
        <Option 
          className={classNames({'top-level': entity.isParent })} 
          key={entity.value} 
          value={entity.value}
          entitytype={entity.entityType}
          projectid={entity.projectId}
          clientid={entity.clientId}
          >
          {entity.label}
        </Option>
      )
    })}
  </SelectContainer>
  )
}

const Activities = () => {
  const opts = useGroupedOptions();

  const [project, setProject] = useState('');
  const selectedEntitiesList = useMemo(() => opts[project]?.entities || [], [project, opts]);

  const projects = useMemo(() => {
    return Object.entries(opts).map(([ projectName, { data: { projectId, clientId } }]) => {
      return { label: projectName, value: projectName, clientid: clientId, projectid: projectId, entitytype: null }
    })
  }, [opts])


  const selectProject = async (value, { clientid, projectid }) => {
    await changeSelectedEntity({ projectId: projectid, entityId: null, entityType: null, clientId: clientid });
    setProject(value)
  }

  const selectEntity = async (value, { entitytype, projectid, clientid }) => {
    await changeSelectedEntity({ projectId: Number(projectid), entityId: value, entityType: entitytype, clientId: clientid });
  }

  return (
    <div>
      <ProjectSelect projects={projects} onSelect={selectProject} />
      <ProjectEntitySelect entities={selectedEntitiesList} onSelect={selectEntity} disabled={!selectedEntitiesList?.length} />
    </div>
  )
};

export default Activities;
