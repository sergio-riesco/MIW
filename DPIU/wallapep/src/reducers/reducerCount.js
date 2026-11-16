const initialState = 1

export default function reducerCount (state = initialState, action) {
    switch (action.type) {
        case "modify/count":
            return action.payload 
        case "plus/count":
            return state+1;
        case "less/count":
            return state-1;
        default:
            return state;
    }
}
