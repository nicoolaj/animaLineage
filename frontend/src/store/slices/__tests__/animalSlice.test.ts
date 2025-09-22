import animalReducer, {
  fetchAnimals,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  markAnimalDead,
  fetchDescendants,
  clearError,
  clearDescendants,
  selectAnimals,
  selectDescendants,
  selectAnimalLoading,
  selectAnimalError
} from '../animalSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

describe('animalSlice', () => {
  const initialState = {
    animals: [],
    descendants: [],
    isLoading: false,
    error: null,
  };

  const mockAnimal = {
    id: 1,
    identifiant_officiel: 'FR123456789',
    nom: 'Bella',
    sexe: 'F',
    date_naissance: '2020-03-15',
    race_id: 1,
    race_nom: 'Holstein',
    elevage_id: 1,
    elevage_nom: 'Ferme du Test',
    mere_id: null,
    pere_id: null,
    statut: 'vivant',
    date_deces: null,
    cause_deces: null,
    description: 'Belle vache laitière',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-01-15T10:00:00Z'
  };

  const mockAnimals = [
    mockAnimal,
    {
      id: 2,
      identifiant_officiel: 'FR987654321',
      nom: 'Hercule',
      sexe: 'M',
      date_naissance: '2019-08-10',
      race_id: 1,
      race_nom: 'Holstein',
      elevage_id: 1,
      elevage_nom: 'Ferme du Test',
      mere_id: null,
      pere_id: null,
      statut: 'vivant',
      date_deces: null,
      cause_deces: null,
      description: 'Taureau reproducteur',
      created_at: '2023-01-20T14:30:00Z',
      updated_at: '2023-01-20T14:30:00Z'
    }
  ];

  const mockDescendants = [
    {
      id: 3,
      identifiant_officiel: 'FR111222333',
      nom: 'Petit Veau',
      sexe: 'M',
      date_naissance: '2023-04-20',
      race_id: 1,
      race_nom: 'Holstein',
      elevage_id: 1,
      elevage_nom: 'Ferme du Test',
      mere_id: 1,
      pere_id: 2,
      statut: 'vivant',
      date_deces: null,
      cause_deces: null,
      description: 'Descendant de Bella et Hercule',
      created_at: '2023-04-20T08:00:00Z',
      updated_at: '2023-04-20T08:00:00Z'
    }
  ];

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(animalReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: {
          code: ERROR_CODES.ANIMAL_001,
          message: 'Some error'
        }
      };

      const result = animalReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });

    it('should handle clearDescendants', () => {
      const stateWithDescendants = {
        ...initialState,
        descendants: mockDescendants
      };

      const result = animalReducer(stateWithDescendants, clearDescendants());
      expect(result.descendants).toEqual([]);
    });
  });

  describe('extraReducers', () => {
    describe('fetchAnimals', () => {
      it('should handle fetchAnimals.pending', () => {
        const action = { type: fetchAnimals.pending.type };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchAnimals.fulfilled', () => {
        const action = { type: fetchAnimals.fulfilled.type, payload: mockAnimals };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.animals).toEqual(mockAnimals);
        expect(state.error).toBeNull();
      });

      it('should handle fetchAnimals.rejected', () => {
        const error = { code: ERROR_CODES.ANIMAL_001, message: 'Fetch animals failed' };
        const action = { type: fetchAnimals.rejected.type, payload: error };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle fetchAnimals.rejected with null payload', () => {
        const action = { type: fetchAnimals.rejected.type, payload: null };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching animals'
        });
      });
    });

    describe('createAnimal', () => {
      it('should handle createAnimal.pending', () => {
        const action = { type: createAnimal.pending.type };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle createAnimal.fulfilled', () => {
        const action = { type: createAnimal.fulfilled.type, payload: mockAnimal };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.animals).toContain(mockAnimal);
        expect(state.error).toBeNull();
      });

      it('should handle createAnimal.rejected', () => {
        const error = { code: ERROR_CODES.ANIMAL_002, message: 'Create animal failed' };
        const action = { type: createAnimal.rejected.type, payload: error };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle createAnimal.rejected with null payload', () => {
        const action = { type: createAnimal.rejected.type, payload: null };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while creating animal'
        });
      });
    });

    describe('updateAnimal', () => {
      it('should handle updateAnimal.pending', () => {
        const action = { type: updateAnimal.pending.type };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle updateAnimal.fulfilled', () => {
        const initialStateWithAnimals = {
          ...initialState,
          animals: [mockAnimal]
        };

        const updatedAnimal = { ...mockAnimal, nom: 'Bella Updated' };
        const action = { type: updateAnimal.fulfilled.type, payload: updatedAnimal };
        const state = animalReducer(initialStateWithAnimals, action);

        expect(state.isLoading).toBe(false);
        expect(state.animals[0]).toEqual(updatedAnimal);
        expect(state.error).toBeNull();
      });

      it('should handle updateAnimal.fulfilled when animal not found in state', () => {
        const updatedAnimal = { ...mockAnimal, nom: 'Bella Updated' };
        const action = { type: updateAnimal.fulfilled.type, payload: updatedAnimal };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle updateAnimal.rejected', () => {
        const error = { code: ERROR_CODES.ANIMAL_006, message: 'Update animal failed' };
        const action = { type: updateAnimal.rejected.type, payload: error };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle updateAnimal.rejected with null payload', () => {
        const action = { type: updateAnimal.rejected.type, payload: null };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while updating animal'
        });
      });
    });

    describe('deleteAnimal', () => {
      it('should handle deleteAnimal.pending', () => {
        const action = { type: deleteAnimal.pending.type };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle deleteAnimal.fulfilled', () => {
        const initialStateWithAnimals = {
          ...initialState,
          animals: mockAnimals
        };

        const action = { type: deleteAnimal.fulfilled.type, payload: 1 };
        const state = animalReducer(initialStateWithAnimals, action);

        expect(state.isLoading).toBe(false);
        expect(state.animals).toHaveLength(1);
        expect(state.animals[0].id).toBe(2);
        expect(state.error).toBeNull();
      });

      it('should handle deleteAnimal.rejected', () => {
        const error = { code: ERROR_CODES.ANIMAL_007, message: 'Delete animal failed' };
        const action = { type: deleteAnimal.rejected.type, payload: error };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle deleteAnimal.rejected with null payload', () => {
        const action = { type: deleteAnimal.rejected.type, payload: null };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while deleting animal'
        });
      });
    });

    describe('markAnimalDead', () => {
      it('should handle markAnimalDead.pending', () => {
        const action = { type: markAnimalDead.pending.type };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle markAnimalDead.fulfilled', () => {
        const initialStateWithAnimals = {
          ...initialState,
          animals: [mockAnimal]
        };

        const deadAnimal = {
          ...mockAnimal,
          statut: 'mort',
          date_deces: '2023-06-15',
          cause_deces: 'Maladie'
        };
        const action = { type: markAnimalDead.fulfilled.type, payload: deadAnimal };
        const state = animalReducer(initialStateWithAnimals, action);

        expect(state.isLoading).toBe(false);
        expect(state.animals[0]).toEqual(deadAnimal);
        expect(state.error).toBeNull();
      });

      it('should handle markAnimalDead.rejected', () => {
        const error = { code: ERROR_CODES.ANIMAL_008, message: 'Mark animal dead failed' };
        const action = { type: markAnimalDead.rejected.type, payload: error };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle markAnimalDead.rejected with null payload', () => {
        const action = { type: markAnimalDead.rejected.type, payload: null };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while marking animal as dead'
        });
      });
    });

    describe('fetchDescendants', () => {
      it('should handle fetchDescendants.pending', () => {
        const action = { type: fetchDescendants.pending.type };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchDescendants.fulfilled', () => {
        const action = { type: fetchDescendants.fulfilled.type, payload: mockDescendants };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.descendants).toEqual(mockDescendants);
        expect(state.error).toBeNull();
      });

      it('should handle fetchDescendants.rejected', () => {
        const error = { code: ERROR_CODES.ANIMAL_006, message: 'Fetch descendants failed' };
        const action = { type: fetchDescendants.rejected.type, payload: error };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle fetchDescendants.rejected with null payload', () => {
        const action = { type: fetchDescendants.rejected.type, payload: null };
        const state = animalReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching descendants'
        });
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      animal: {
        animals: mockAnimals,
        descendants: mockDescendants,
        isLoading: true,
        error: { code: ERROR_CODES.ANIMAL_001, message: 'Test error' },
      },
    };

    it('should select animals', () => {
      expect(selectAnimals(mockState)).toEqual(mockAnimals);
    });

    it('should select descendants', () => {
      expect(selectDescendants(mockState)).toEqual(mockDescendants);
    });

    it('should select loading state', () => {
      expect(selectAnimalLoading(mockState)).toBe(true);
    });

    it('should select error state', () => {
      expect(selectAnimalError(mockState)).toEqual({
        code: ERROR_CODES.ANIMAL_001,
        message: 'Test error',
      });
    });
  });

  describe('state transitions', () => {
    it('should handle multiple state updates correctly', () => {
      let state = animalReducer(initialState, { type: fetchAnimals.pending.type });
      expect(state.isLoading).toBe(true);

      state = animalReducer(state, {
        type: fetchAnimals.fulfilled.type,
        payload: mockAnimals,
      });
      expect(state.isLoading).toBe(false);
      expect(state.animals).toEqual(mockAnimals);
      expect(state.error).toBeNull();

      state = animalReducer(state, { type: fetchDescendants.pending.type });
      expect(state.isLoading).toBe(true);

      state = animalReducer(state, {
        type: fetchDescendants.fulfilled.type,
        payload: mockDescendants,
      });
      expect(state.isLoading).toBe(false);
      expect(state.descendants).toEqual(mockDescendants);
      expect(state.animals).toEqual(mockAnimals); // Should not affect animals array
    });

    it('should preserve other state when clearing specific properties', () => {
      const stateWithData = {
        ...initialState,
        animals: mockAnimals,
        descendants: mockDescendants,
        error: { code: ERROR_CODES.ANIMAL_001, message: 'Test error' },
      };

      const afterClearError = animalReducer(stateWithData, clearError());
      expect(afterClearError.error).toBeNull();
      expect(afterClearError.animals).toEqual(mockAnimals);
      expect(afterClearError.descendants).toEqual(mockDescendants);

      const afterClearDescendants = animalReducer(afterClearError, clearDescendants());
      expect(afterClearDescendants.descendants).toEqual([]);
      expect(afterClearDescendants.animals).toEqual(mockAnimals);
      expect(afterClearDescendants.error).toBeNull();
    });

    it('should handle error states correctly', () => {
      const errorState = {
        ...initialState,
        animals: mockAnimals,
        isLoading: true,
      };

      const error = { code: ERROR_CODES.ANIMAL_001, message: 'API Error' };
      const result = animalReducer(errorState, {
        type: fetchAnimals.rejected.type,
        payload: error,
      });

      expect(result.isLoading).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.animals).toEqual(mockAnimals); // Should preserve existing data
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action types gracefully', () => {
      const result = animalReducer(initialState, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle undefined state gracefully', () => {
      const result = animalReducer(undefined, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle empty payloads gracefully', () => {
      const result = animalReducer(initialState, {
        type: fetchAnimals.fulfilled.type,
        payload: [],
      });
      expect(result.animals).toEqual([]);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should handle updating non-existent animal', () => {
      const updatedAnimal = { ...mockAnimal, id: 999, nom: 'Non-existent' };
      const initialStateWithAnimals = {
        ...initialState,
        animals: mockAnimals
      };

      const result = animalReducer(initialStateWithAnimals, {
        type: updateAnimal.fulfilled.type,
        payload: updatedAnimal,
      });

      expect(result.animals).toEqual(mockAnimals); // Should remain unchanged
      expect(result.isLoading).toBe(false);
    });

    it('should handle deleting non-existent animal', () => {
      const initialStateWithAnimals = {
        ...initialState,
        animals: mockAnimals
      };

      const result = animalReducer(initialStateWithAnimals, {
        type: deleteAnimal.fulfilled.type,
        payload: 999,
      });

      expect(result.animals).toEqual(mockAnimals); // Should remain unchanged
      expect(result.isLoading).toBe(false);
    });

    it('should handle marking non-existent animal as dead', () => {
      const deadAnimal = { ...mockAnimal, id: 999, statut: 'mort' };
      const initialStateWithAnimals = {
        ...initialState,
        animals: mockAnimals
      };

      const result = animalReducer(initialStateWithAnimals, {
        type: markAnimalDead.fulfilled.type,
        payload: deadAnimal,
      });

      expect(result.animals).toEqual(mockAnimals); // Should remain unchanged
      expect(result.isLoading).toBe(false);
    });
  });
});