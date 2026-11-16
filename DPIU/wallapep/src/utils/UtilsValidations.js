export let validateFormDataInputRequired =
    (formData, inputKey, formErrors, setFormErrors) => {

        let regexNotEmpty = /^(.+)$/;
        let errorMessage = "This field is required, write it to continue"
        return validateFormDataInput(
            formData, inputKey, formErrors, setFormErrors, regexNotEmpty, errorMessage)
    }


export let validateFormDataInputEmail =
    (formData, inputKey, formErrors, setFormErrors) => {

        let regexEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
        let errorMessage = "Write a valid email, e.g. name@example.com"
        return validateFormDataInput(
            formData, inputKey, formErrors, setFormErrors, regexEmail, errorMessage)
    }

export let validateFormDataInput =
    (formData, inputKey, formErrors, setFormErrors, regex, msgError) => {
        // not write Yet
        if (formData[inputKey] == null) {
            return true
        }

        // have a serverError
        if (formErrors[inputKey]?.type == "server") {
            return false
        }


        // Have some value, remove the error only client erros
        if (formData[inputKey] != null && regex.test(formData[inputKey])) {
            if (formErrors[inputKey] != null ) {
                formErrors[inputKey] = null;
                setFormErrors(formErrors)
                // don't put again the value in state
            }
            return true;
        }

        // Dont have value put the error
        if (formErrors[inputKey] == null) {
            formErrors[inputKey] = {msg: msgError }
            setFormErrors(formErrors)
        }
        return false;
    }

export let allowSubmitForm = (formData, formErrors, requiredInputWithNoErrors) => {
    let result = true;
    requiredInputWithNoErrors.forEach(inputKey => {
        // With client errors you cant not submit form
        // type: "server" 
        if ((formData[inputKey] == null
            || formErrors[inputKey] != null) && formErrors[inputKey]?.type != "server" ) {

            result = false;
            return;
        }
    })
    return result;
}

export let setServerErrors = (serverErrors, setFormErrors) => {
    let newFormErrors = {} //delete all previous
    if ( Array.isArray(serverErrors)){
        serverErrors.forEach(e => {
            newFormErrors[e.field] = { msg: e.msg, type: "server" }
        });
    }
    // destroy all previous errors is a new SET
    setFormErrors(newFormErrors)
}

export let joinAllServerErrorMessages = (serverErrors) => {
    let generalErrorMessage = "";
    if ( Array.isArray(serverErrors)){
        serverErrors.forEach(e => {
            generalErrorMessage += e.msg
        });
    } else {
        if (serverErrors?.msg != null){
            generalErrorMessage = serverErrors.msg;
        }
    }
    return generalErrorMessage
}

