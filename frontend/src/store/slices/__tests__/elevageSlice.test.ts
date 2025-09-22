import elevageReducer, {
  fetchElevages,
  fetchElevageById,
  createElevage,
  updateElevage,
  deleteElevage,
  fetchElevageUsers,
  addUserToElevage,
  removeUserFromElevage,
  clearError,
  setShowMyOnly,
  clearCurrentElevage,
  selectElevages,
  selectCurrentElevage,
  selectElevageUsers,
  selectElevageLoading,
  selectElevageError,
  selectShowMyOnly
} from '../elevageSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

describe('elevageSlice', () => {
  const initialState = {
    elevages: [],
    currentElevage: null,
    elevageUsers: [],
    isLoading: false,
    error: null,
    showMyOnly: false,
  };

  const mockRace = {
    id: 1,
    nom: 'Holstein',
    type_animal_nom: 'Bovin',
    description: 'Race laitière'
  };

  const mockElevage = {
    id: 1,
    nom: 'Ferme du Test',
    adresse: '123 Rue de la Ferme',
    user_id: 1,
    proprietaire_nom: 'Jean Dupont',
    description: 'Élevage de test',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-01-15T10:00:00Z',
    nb_animaux: 5,
    permissions: {
      can_read: true,
      can_write: true,
      can_manage: true
    }
  };

  const mockElevages = [
    mockElevage,
    {
      id: 2,
      nom: 'Ferme du Sud',
      adresse: '456 Avenue de la Prairie',
      user_id: 2,
      proprietaire_nom: 'Marie Martin',
      description: 'Autre élevage de test',
      created_at: '2023-02-20T14:30:00Z',
      updated_at: '2023-02-20T14:30:00Z',
      nb_animaux: 10,
      permissions: {
        can_read: true,
        can_write: false,
        can_manage: false
      }
    }
  ];

  const mockElevageUsers = [
    {
      user_id: 1,
      user_name: 'Jean Dupont',
      user_email: 'jean@example.com',
      role_in_elevage: 'owner' as const,
      added_at: '2023-01-15T10:00:00Z',
    },
    {
      user_id: 2,
      user_name: 'Marie Martin',
      user_email: 'marie@example.com',
      role_in_elevage: 'collaborator' as const,
      added_at: '2023-02-20T14:30:00Z',
    }
  ];

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(elevageReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: {
          code: ERROR_CODES.ELEVAGE_001,
          message: 'Some error'
        }
      };

      const actual = elevageReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });

    it('should handle setShowMyOnly', () => {
      const actual = elevageReducer(initialState, setShowMyOnly(true));
      expect(actual.showMyOnly).toBe(true);

      const actualFalse = elevageReducer(actual, setShowMyOnly(false));
      expect(actualFalse.showMyOnly).toBe(false);
    });

    it('should handle clearCurrentElevage', () => {
      const stateWithCurrentElevage = {
        ...initialState,
        currentElevage: mockElevage
      };

      const actual = elevageReducer(stateWithCurrentElevage, clearCurrentElevage());
      expect(actual.currentElevage).toBeNull();
    });
  });

  describe('extraReducers', () => {
    describe('fetchElevages', () => {
      it('should handle fetchElevages.pending', () => {
        const action = { type: fetchElevages.pending.type };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchElevages.fulfilled', () => {
        const action = { type: fetchElevages.fulfilled.type, payload: mockElevages };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.elevages).toEqual(mockElevages);
        expect(state.error).toBeNull();
      });

      it('should handle fetchElevages.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_001, message: 'Fetch elevages failed' };
        const action = { type: fetchElevages.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle fetchElevages.rejected with null payload', () => {
        const action = { type: fetchElevages.rejected.type, payload: null };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching breeding farms'
        });
      });
    });

    describe('fetchElevageById', () => {
      it('should handle fetchElevageById.pending', () => {
        const action = { type: fetchElevageById.pending.type };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchElevageById.fulfilled', () => {
        const action = { type: fetchElevageById.fulfilled.type, payload: mockElevage };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.currentElevage).toEqual(mockElevage);
        expect(state.error).toBeNull();
      });

      it('should handle fetchElevageById.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_001, message: 'Elevage not found' };
        const action = { type: fetchElevageById.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });

    describe('createElevage', () => {
      it('should handle createElevage.pending', () => {
        const action = { type: createElevage.pending.type };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle createElevage.fulfilled', () => {
        const action = { type: createElevage.fulfilled.type, payload: mockElevage };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.elevages).toContain(mockElevage);
        expect(state.error).toBeNull();
      });

      it('should handle createElevage.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_002, message: 'Create elevage failed' };
        const action = { type: createElevage.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });

    describe('updateElevage', () => {
      it('should handle updateElevage.pending', () => {
        const action = { type: updateElevage.pending.type };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle updateElevage.fulfilled', () => {
        const initialStateWithElevages = {
          ...initialState,
          elevages: [mockElevage],
          currentElevage: mockElevage
        };

        const updatedElevage = { ...mockElevage, nom: 'Ferme Modifiée' };
        const action = { type: updateElevage.fulfilled.type, payload: updatedElevage };
        const state = elevageReducer(initialStateWithElevages, action);

        expect(state.isLoading).toBe(false);
        expect(state.elevages[0]).toEqual(updatedElevage);
        expect(state.currentElevage).toEqual(updatedElevage);
        expect(state.error).toBeNull();
      });

      it('should handle updateElevage.fulfilled when elevage not found in state', () => {
        const updatedElevage = { ...mockElevage, nom: 'Ferme Modifiée' };
        const action = { type: updateElevage.fulfilled.type, payload: updatedElevage };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle updateElevage.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_006, message: 'Update elevage failed' };
        const action = { type: updateElevage.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });

    describe('deleteElevage', () => {
      it('should handle deleteElevage.pending', () => {
        const action = { type: deleteElevage.pending.type };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle deleteElevage.fulfilled', () => {
        const initialStateWithElevages = {
          ...initialState,
          elevages: mockElevages,
          currentElevage: mockElevage
        };

        const action = { type: deleteElevage.fulfilled.type, payload: 1 };
        const state = elevageReducer(initialStateWithElevages, action);

        expect(state.isLoading).toBe(false);
        expect(state.elevages).toHaveLength(1);
        expect(state.elevages[0].id).toBe(2);
        expect(state.currentElevage).toBeNull();
        expect(state.error).toBeNull();
      });

      it('should handle deleteElevage.fulfilled when deleting non-current elevage', () => {
        const initialStateWithElevages = {
          ...initialState,
          elevages: mockElevages,
          currentElevage: mockElevages[1] // Set current to second elevage
        };

        const action = { type: deleteElevage.fulfilled.type, payload: 1 };
        const state = elevageReducer(initialStateWithElevages, action);

        expect(state.isLoading).toBe(false);
        expect(state.elevages).toHaveLength(1);
        expect(state.elevages[0].id).toBe(2);
        expect(state.currentElevage).toEqual(mockElevages[1]); // Current should remain unchanged
        expect(state.error).toBeNull();
      });

      it('should handle deleteElevage.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_005, message: 'Delete elevage failed' };
        const action = { type: deleteElevage.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });

    describe('fetchElevageUsers', () => {
      it('should handle fetchElevageUsers.pending', () => {
        const action = { type: fetchElevageUsers.pending.type };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchElevageUsers.fulfilled', () => {
        const action = { type: fetchElevageUsers.fulfilled.type, payload: mockElevageUsers };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.elevageUsers).toEqual(mockElevageUsers);
        expect(state.error).toBeNull();
      });

      it('should handle fetchElevageUsers.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_010, message: 'Fetch elevage users failed' };
        const action = { type: fetchElevageUsers.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });

    describe('addUserToElevage', () => {
      it('should handle addUserToElevage.fulfilled', () => {
        const stateWithError = {
          ...initialState,
          error: { code: ERROR_CODES.ELEVAGE_008, message: 'Previous error' }
        };
        const action = { type: addUserToElevage.fulfilled.type, payload: mockElevageUsers[0] };
        const state = elevageReducer(stateWithError, action);

        expect(state.error).toBeNull();
        // Note: addUserToElevage.fulfilled ne modifie pas elevageUsers directement
        // Il compte sur fetchElevageUsers pour recharger la liste
      });

      it('should handle addUserToElevage.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_008, message: 'Add user to elevage failed' };
        const action = { type: addUserToElevage.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.error).toEqual(error);
      });
    });

    describe('removeUserFromElevage', () => {
      it('should handle removeUserFromElevage.fulfilled', () => {
        const initialStateWithUsers = {
          ...initialState,
          elevageUsers: mockElevageUsers
        };

        const action = { type: removeUserFromElevage.fulfilled.type, payload: 2 };
        const state = elevageReducer(initialStateWithUsers, action);

        expect(state.elevageUsers).toHaveLength(1);
        expect(state.elevageUsers[0].user_id).toBe(1);
        expect(state.error).toBeNull();
      });

      it('should handle removeUserFromElevage.rejected', () => {
        const error = { code: ERROR_CODES.ELEVAGE_009, message: 'Remove user from elevage failed' };
        const action = { type: removeUserFromElevage.rejected.type, payload: error };
        const state = elevageReducer(initialState, action);

        expect(state.error).toEqual(error);
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      elevage: {
        elevages: mockElevages,
        currentElevage: mockElevage,
        elevageUsers: mockElevageUsers,
        isLoading: true,
        error: { code: ERROR_CODES.ELEVAGE_001, message: 'Test error' },
        showMyOnly: true,
      },
    };

    it('should select elevages', () => {
      expect(selectElevages(mockState)).toEqual(mockElevages);
    });

    it('should select current elevage', () => {
      expect(selectCurrentElevage(mockState)).toEqual(mockElevage);
    });

    it('should select elevage users', () => {
      expect(selectElevageUsers(mockState)).toEqual(mockElevageUsers);
    });

    it('should select loading state', () => {
      expect(selectElevageLoading(mockState)).toBe(true);
    });

    it('should select error state', () => {
      expect(selectElevageError(mockState)).toEqual({
        code: ERROR_CODES.ELEVAGE_001,
        message: 'Test error',
      });
    });

    it('should select showMyOnly flag', () => {
      expect(selectShowMyOnly(mockState)).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('should handle multiple state updates correctly', () => {
      let state = elevageReducer(initialState, { type: fetchElevages.pending.type });
      expect(state.isLoading).toBe(true);

      state = elevageReducer(state, {
        type: fetchElevages.fulfilled.type,
        payload: mockElevages,
      });
      expect(state.isLoading).toBe(false);
      expect(state.elevages).toEqual(mockElevages);
      expect(state.error).toBeNull();

      state = elevageReducer(state, setShowMyOnly(true));
      expect(state.showMyOnly).toBe(true);
      expect(state.elevages).toEqual(mockElevages); // Should not affect elevages
    });

    it('should preserve other state when clearing specific properties', () => {
      const stateWithData = {
        ...initialState,
        elevages: mockElevages,
        currentElevage: mockElevage,
        elevageUsers: mockElevageUsers,
        error: { code: ERROR_CODES.ELEVAGE_001, message: 'Test error' },
        showMyOnly: true,
      };

      const afterClearError = elevageReducer(stateWithData, clearError());
      expect(afterClearError.error).toBeNull();
      expect(afterClearError.elevages).toEqual(mockElevages);
      expect(afterClearError.currentElevage).toEqual(mockElevage);
      expect(afterClearError.showMyOnly).toBe(true);

      const afterClearCurrent = elevageReducer(afterClearError, clearCurrentElevage());
      expect(afterClearCurrent.currentElevage).toBeNull();
      expect(afterClearCurrent.elevages).toEqual(mockElevages);
      expect(afterClearCurrent.showMyOnly).toBe(true);
    });

    it('should handle error states correctly', () => {
      const errorState = {
        ...initialState,
        elevages: mockElevages,
        isLoading: true,
      };

      const error = { code: ERROR_CODES.ELEVAGE_001, message: 'API Error' };
      const result = elevageReducer(errorState, {
        type: fetchElevages.rejected.type,
        payload: error,
      });

      expect(result.isLoading).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.elevages).toEqual(mockElevages); // Should preserve existing data
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action types gracefully', () => {
      const result = elevageReducer(initialState, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle undefined state gracefully', () => {
      const result = elevageReducer(undefined, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle empty payloads gracefully', () => {
      const result = elevageReducer(initialState, {
        type: fetchElevages.fulfilled.type,
        payload: [],
      });
      expect(result.elevages).toEqual([]);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should handle updating non-existent elevage', () => {
      const updatedElevage = { ...mockElevage, id: 999, nom: 'Non-existent' };
      const initialStateWithElevages = {
        ...initialState,
        elevages: mockElevages
      };

      const result = elevageReducer(initialStateWithElevages, {
        type: updateElevage.fulfilled.type,
        payload: updatedElevage,
      });

      expect(result.elevages).toEqual(mockElevages); // Should remain unchanged
      expect(result.isLoading).toBe(false);
    });

    it('should handle deleting non-existent elevage', () => {
      const initialStateWithElevages = {
        ...initialState,
        elevages: mockElevages
      };

      const result = elevageReducer(initialStateWithElevages, {
        type: deleteElevage.fulfilled.type,
        payload: 999,
      });

      expect(result.elevages).toEqual(mockElevages); // Should remain unchanged
      expect(result.isLoading).toBe(false);
    });
  });
});