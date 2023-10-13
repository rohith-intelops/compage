import {requireEmailMiddleware} from '../middlewares/auth';
import {Request, Response, Router} from 'express';
import Logger from '../utils/logger';
import {
    getCreateGitPlatformError,
    getCreateGitPlatformResponse,
    getDeleteGitPlatformError,
    getGetGitPlatformError,
    getGetGitPlatformResponse,
    getGitPlatformEntity,
    getListGitPlatformsError,
    getListGitPlatformsResponse,
    getUpdateGitPlatformError,
    GitPlatformDTO,
    GitPlatformEntity
} from '../models/gitPlatform';
import {GitPlatformService} from '../services/gitPlatformService';

const gitPlatformsOperationsRouter = Router();
const gitPlatformService = new GitPlatformService();

// create gitPlatform for owner_email with details given in request
gitPlatformsOperationsRouter.post('/users/:email/gitPlatforms', requireEmailMiddleware, async (request: Request, response: Response) => {
    const ownerEmail = request.params.email;
    const gitPlatformDTO: GitPlatformDTO = request.body;
    // check if the received payload has same id as the one in the path.
    if ((ownerEmail.length === 0 || ownerEmail !== gitPlatformDTO.ownerEmail)) {
        return response.status(400).json(getUpdateGitPlatformError('email in path and payload are not same'));
    }
    try {
        const gitPlatformEntity: GitPlatformEntity = await gitPlatformService.getGitPlatform(gitPlatformDTO.ownerEmail, gitPlatformDTO.name);
        if (gitPlatformEntity.owner_email.length !== 0 || gitPlatformEntity.name.length !== 0) {
            const errorMessage = `[${gitPlatformDTO.ownerEmail}] gitPlatform[${gitPlatformDTO.name}] already exists.`;
            Logger.error(errorMessage);
            return response.status(400).json(getCreateGitPlatformError(errorMessage));
        }
        // add createdAt and updatedAt
        gitPlatformDTO.createdAt = new Date().toISOString();
        gitPlatformDTO.updatedAt = new Date().toISOString();

        const savedGitPlatformEntity: GitPlatformEntity = await gitPlatformService.createGitPlatform(getGitPlatformEntity(gitPlatformDTO));
        if (savedGitPlatformEntity.name.length !== 0) {
            const successMessage = `[${gitPlatformDTO.ownerEmail}] gitPlatform[${gitPlatformDTO.name}] created.`;
            Logger.info(successMessage);
            return response.status(201).json(getCreateGitPlatformResponse(savedGitPlatformEntity));
        }
        const message = `${gitPlatformDTO.ownerEmail} gitPlatform [${gitPlatformDTO.name}] couldn't be created.`;
        Logger.error(message);
        return response.status(500).json(getCreateGitPlatformError(message));
    } catch (err: any) {
        const message = `${gitPlatformDTO.ownerEmail} gitPlatform [${gitPlatformDTO.name}] couldn't be created[${err.message}].`;
        Logger.debug(err);
        Logger.error(message);
        return response.status(500).json(getCreateGitPlatformError(message));
    }
});

// get gitPlatform by owner_email and name for given gitPlatform
gitPlatformsOperationsRouter.get('/users/:email/gitPlatforms/:name', requireEmailMiddleware, async (request: Request, response: Response) => {
    const ownerEmail = request.params.email;
    const name = request.params.name;
    try {
        const gitPlatformEntity: GitPlatformEntity = await gitPlatformService.getGitPlatform(ownerEmail as string, name as string);
        // check if there is id present in the object.
        if (gitPlatformEntity.owner_email.length !== 0 && gitPlatformEntity.name.length !== 0) {
            return response.status(200).json(getGetGitPlatformResponse(gitPlatformEntity));
        }
        const message = `gitPlatform couldn't be retrieved.`;
        Logger.error(message);
        return response.status(404).json();
    } catch (err: any) {
        const message = `gitPlatform couldn't be retrieved[${err.message}].`;
        Logger.debug(err);
        Logger.error(message);
        return response.status(500).json(getGetGitPlatformError(message));
    }
});

// list all gitPlatforms for given gitPlatform
gitPlatformsOperationsRouter.get('/users/:email/gitPlatforms', requireEmailMiddleware, async (request: Request, response: Response) => {
    const ownerEmail = request.params.email;
    try {
        const gitPlatformEntities = await gitPlatformService.listGitPlatforms(ownerEmail as string);
        return response.status(200).json(getListGitPlatformsResponse(gitPlatformEntities));
    } catch (err: any) {
        const message = `gitPlatforms couldn't be listed[${err.message}].`;
        Logger.debug(err);
        Logger.error(message);
        return response.status(500).json(getListGitPlatformsError(message));
    }
});

// update gitPlatform with details given in request
gitPlatformsOperationsRouter.put('/users/:email/gitPlatforms/:name', async (request: Request, response: Response) => {
    const ownerEmail = request.params.email;
    const name = request.params.name;
    const gitPlatformDTO: GitPlatformDTO = request.body;
    // check if the received payload has same id as the one in the path.
    if ((ownerEmail.length === 0 || ownerEmail !== gitPlatformDTO.ownerEmail) || (name.length === 0 || name !== gitPlatformDTO.name)) {
        return response.status(400).json(getUpdateGitPlatformError('email and name in path and payload are not same'));
    }
    try {
        const gitPlatformEntity: GitPlatformEntity = await gitPlatformService.getGitPlatform(gitPlatformDTO.ownerEmail, gitPlatformDTO.name);
        if (gitPlatformEntity.owner_email.length === 0 || gitPlatformEntity.name.length === 0) {
            const errorMessage = `[${gitPlatformDTO.ownerEmail}] gitPlatform[${gitPlatformDTO.name}] don't exist.`;
            Logger.error(errorMessage);
            return response.status(400).json(getUpdateGitPlatformError(errorMessage));
        }
        gitPlatformEntity.updated_at = new Date().toISOString();
        gitPlatformEntity.personal_access_token = gitPlatformDTO.personalAccessToken;
        const isUpdated = await gitPlatformService.updateGitPlatform(ownerEmail, name, gitPlatformEntity);
        if (isUpdated) {
            const successMessage = `[${gitPlatformDTO.ownerEmail}] gitPlatform[${gitPlatformDTO.name}] updated.`;
            Logger.info(successMessage);
            return response.status(204).json();
        }
        const message = `[${gitPlatformDTO.ownerEmail}] gitPlatform[${gitPlatformDTO.name}] couldn't be updated.`;
        Logger.error(message);
        return response.status(500).json(getUpdateGitPlatformError(message));
    } catch (err: any) {
        const message = `[${gitPlatformDTO.ownerEmail}] gitPlatform[${gitPlatformDTO.name}] couldn't be updated[${err.message}].`;
        Logger.debug(err);
        Logger.error(message);
        return response.status(500).json(getUpdateGitPlatformError(message));
    }
}, requireEmailMiddleware);

// delete gitPlatform by id for given gitPlatform
gitPlatformsOperationsRouter.delete('/users/:email/gitPlatforms/:name', requireEmailMiddleware, async (request: Request, response: Response) => {
    const ownerEmail = request.params.email;
    const name = request.params.name;
    try {
        const isDeleted = await gitPlatformService.deleteGitPlatform(ownerEmail, name);
        if (isDeleted) {
            const successMessage = `'${ownerEmail}' gitPlatform[${name}] deleted successfully.`;
            Logger.info(successMessage);
            return response.status(204).json();
        }
        const errorMessage = `'${ownerEmail}' gitPlatform[${name}] couldn't be deleted.`;
        Logger.error(errorMessage);
        return response.status(500).json(getDeleteGitPlatformError(errorMessage));
    } catch (err: any) {
        const message = `'${ownerEmail}' gitPlatform[${name}] couldn't be deleted[${err.message}].`;
        Logger.debug(err);
        Logger.error(message);
        return response.status(500).json(getDeleteGitPlatformError(message));
    }
});

export default gitPlatformsOperationsRouter;