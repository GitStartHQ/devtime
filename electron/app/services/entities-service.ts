import { fetchGraphQLClient, getUserFromToken } from '../graphql';
import { logManager } from '../log-manager';
import { settingsService } from './settings-service';

export const FETCH_DEVELOPER_TASKS = `
  query fetchDeveloperTasks($userId: Int!) {
    client_projects(
      where: {
        _or: [
          {
            tickets: {
              tasks: {
                _or: [
                  { developerByDeveloperid: { user: { id: { _eq: $userId } } } }
                  { developerByManagerid: { user: { id: { _eq: $userId } } } }
                  { developerByReviewerid: { user: { id: { _eq: $userId } } } }
                ]
              }
            }
          }
          { project_managers: { userId: { _eq: $userId } } }
          { user_team_client: { user: { id: { _eq: $userId } } } }
        ]
      }
    ) {
      name
      id
      clientId
      tickets(
        where: {
          _and: [
            { status: { _nin: [cancelled, finished, available] } }
            {
              _or: [
                {
                  tasks: {
                    _or: [
                      { developerByDeveloperid: { user: { id: { _eq: $userId } } } }
                      { developerByManagerid: { user: { id: { _eq: $userId } } } }
                      { developerByReviewerid: { user: { id: { _eq: $userId } } } }
                    ]
                  }
                }
                { 
                	manager: { id: { _eq: $userId } }
                }
              ]
            }
          ]
        }
      ) {
        id
        code
        tasks {
          id
          taskCode
          type
          ticketCode
          title
          clientId
          status
          costInUSD
          developerId
          managerId
          reviewerId
          startedAt
          updatedAt
          createdAt
          completedAt
          ticket {
            ticketLink
            code
            id
          }
        }
      }
    }
  }
`;

export class EntitiesService {
    logger = logManager.getLogger('EntitiesService');

    cache: any = {};

    async getAll() {
      const settings = await settingsService.getLoginSettings();
      const token = settings?.token;

      if (!token) {
        console.error("User token is not valid");
        return;
      }

      const user = getUserFromToken(token);

      if (!user?.id) {
        console.error('User token is not valid');
        return;
      }

      const fetchPossibleEntities: any = await fetchGraphQLClient(process.env.HASURA_GRAPHQL_ENGINE_DOMAIN, {
            token,
        })({
          operationAction: FETCH_DEVELOPER_TASKS,
          variables: {
            userId: user.id
          }
        })

        return fetchPossibleEntities?.data?.client_projects
    }

}

export const entitiesService = new EntitiesService();
