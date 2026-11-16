export let modifyStateProperty = (state, setState, key, value) => {
    setState({
        ...state,
        [key]: value
    });
}
