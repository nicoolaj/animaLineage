import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Configuration du worker MSW pour le développement
export const worker = setupWorker(...handlers);