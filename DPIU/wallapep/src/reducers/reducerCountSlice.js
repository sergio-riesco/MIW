import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
    name: 'counterSlice',
    initialState: 999,
    reducers: {
        modify: (state,action) => {
            return action.payload;
        },
        increment: (state,action) => {
            return state+1;
        },
        decrement: (state,action) => {
            return state-1;
        },
    },
});

// las acciones que pueden utilizar para llamarlos desde un componente
export const actions = counterSlice.actions;
export default counterSlice.reducer;
