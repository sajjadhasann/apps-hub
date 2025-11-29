// /js/application-form-utils.js

/**
 * Helper function to convert HTML form data into a JavaScript object.
 * @param {HTMLFormElement} formElement - The form element.
 * @returns {object} - Object containing form fields and values.
 */
export function serializeForm(formElement) {
    const form = new FormData(formElement);
    return Object.fromEntries(form.entries());
}


/**
 * Validates if a category has been selected in the form.
 * @param {Event} e - The submit event.
 * @returns {boolean} - true if category is selected, false otherwise.
 */
export function validateCategory(e) {
    const select = document.querySelector("select[name='category']");
    const value = select ? select.value.trim() : "";

    if (value === "") {
        e.preventDefault();
        alert("Please select a category.");
        return false;
    }
    return true;
}
