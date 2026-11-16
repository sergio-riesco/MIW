import { configureStore } from "@reduxjs/toolkit";
import reducerCount from "./reducerCount";
import reducerCountSlice from "./reducerCountSlice";

let store = configureStore(
    {
        reducer: {
            reducerCount,
            reducerCountSlice,
        }
    })

export default store
