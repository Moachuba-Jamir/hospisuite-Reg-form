AOS.init({
    // Global settings:
    disable: false, // accepts following values: 'phone', 'tablet', 'mobile', boolean, expression or function
    startEvent: 'DOMContentLoaded', // name of the event dispatched on the document, that AOS should initialize on
    initClassName: 'aos-init', // class applied after initialization
    animatedClassName: 'aos-animate', // class applied on animation
    useClassNames: false, // if true, will add content of `data-aos` as classes on scroll
    disableMutationObserver: false, // disables automatic mutations' detections (advanced)
    debounceDelay: 50, // the delay on debounce used while resizing window (advanced)
    throttleDelay: 99, // the delay on throttle used while scrolling the page (advanced)
    
  
    // Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
    offset: 80, // offset (in px) from the original trigger point
    delay: 0, // values from 0 to 3000, with step 50ms
    duration: 600, // values from 0 to 3000, with step 50ms
    easing: 'ease', // default easing for AOS animations
    once: false, // whether animation should happen only once - while scrolling down
    mirror: true, // whether elements should animate out while scrolling past them
    anchorPlacement: 'top-bottom', // defines which position of the element regarding to window should trigger the animation
  
  });
// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set max date for DOB to today
    const dobInput = document.getElementById('dob');
    const today = new Date().toISOString().split('T')[0];
    if (dobInput) {
        dobInput.setAttribute('max', today);
    } else {
        console.error('Element with ID "dob" not found in the DOM.');
    }

    // Show/hide "Other" profession field based on selection
    document.getElementById('fieldPractice').addEventListener('change', function() {
        const otherField = document.getElementById('otherProfessionField');
        const otherInput = document.getElementById('otherProfession');
        if (this.value === 'other') {
            otherField.style.display = 'block';
            otherInput.setAttribute('required', 'required');
        } else {
            otherField.style.display = 'none';
            otherInput.removeAttribute('required');
            otherInput.value = ''; // Clear the input when "Other" is not selected
            validateField(otherInput); // Re-validate the "Other Profession" field
        }
        validateField(this); // Validate the "Field of Practice" select
    });

    // Populate Year of Registration dropdown (1970 to current year)
    const yearSelect = document.getElementById('yearReg');
    const currentYear = new Date().getFullYear();
    for (let year = 1970; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Function to validate a field and update the parent form-section
    function validateField(field) {
        const formSection = field.closest('.form-section');
        let isValid = false;

        if (field.tagName === 'INPUT') {
            if (field.type === 'email') {
                // Basic email validation
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailPattern.test(field.value);
            } else if (field.type === 'tel') {
                // Basic phone number validation (e.g., at least 10 digits)
                const phonePattern = /^\d{10,}$/;
                isValid = phonePattern.test(field.value);
            } else if (field.type === 'date') {
                // Check if a date is selected
                isValid = field.value !== '';
            } else {
                // For text inputs (e.g., fullName, medRegNum)
                isValid = field.value.trim() !== '';
            }
        } else if (field.tagName === 'SELECT') {
            // For select elements, check if a non-empty option is selected
            isValid = field.value !== '';
        }

        // Toggle the .form-section-valid class based on validation
        if (isValid) {
            formSection.classList.add('form-section-valid');
        } else {
            formSection.classList.remove('form-section-valid');
        }
    }

    // Special validation for radio buttons (Gender)
    function validateRadioButtons(name) {
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        const formSection = radios[0].closest('.form-section');
        const isChecked = Array.from(radios).some(radio => radio.checked);

        if (isChecked) {
            formSection.classList.add('form-section-valid');
        } else {
            formSection.classList.remove('form-section-valid');
        }
    }

    // Add event listeners to all inputs and selects
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'radio') {
            input.addEventListener('change', () => validateRadioButtons(input.name));
        } else {
            // Use 'input' event for real-time validation, 'change' for selects
            input.addEventListener('input', () => validateField(input));
            input.addEventListener('change', () => validateField(input));
            input.addEventListener('blur', () => validateField(input));
        }
    });

    // Form submission and encryption logic
    document.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        let query = window.location.search.substring(1);
        let userNumber = query.replace(/^q=/, "");
        console.log(userNumber);

        const dobInput = document.getElementById('dob').value;
        const dobDate = new Date(dobInput);
        const formattedDob = `${String(dobDate.getDate()).padStart(2, '0')}/${String(dobDate.getMonth() + 1).padStart(2, '0')}/${dobDate.getFullYear()}`;

        // Get the fieldPractice value and append the "Other Profession" if applicable
        let fieldPracticeValue = document.getElementById('fieldPractice').value;
        const otherProfessionValue = document.getElementById('otherProfession').value.trim();
        if (fieldPracticeValue === 'other' && otherProfessionValue) {
            fieldPracticeValue = `${otherProfessionValue}`; // Use only the "Other Profession" value
        }

        const formData = {
            email: document.getElementById('email').value,
            fullName: document.getElementById('fullName').value,
            gender: document.querySelector('input[name="gender"]:checked')?.value || '',
            dob: formattedDob,
            mobile: document.getElementById('mobile').value,
            state: document.getElementById('state').value,
            medRegNum: document.getElementById('medRegNum').value,
            yearReg: document.getElementById('yearReg').value,
            fieldPractice: fieldPracticeValue,
            yearsExp: document.getElementById('yearsExp').value,
            waNumber: userNumber
        };

        if (!dobInput) {
            alert('Please select a valid Date of Birth.');
            return;
        }

        console.log('Form Data:', formData);

        try {
            const data = JSON.stringify(formData);
            const encoder = new TextEncoder();
            const key = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            console.log('Generated Key:', key);

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encoder.encode(data)
            );

            const exported = await crypto.subtle.exportKey('jwk', key);
            console.log('Exported Key:', exported);

            const encryptedArray = new Uint8Array(encryptData);
            const cipherText = encryptedArray.slice(0, -16);
            const tag = encryptedArray.slice(-16);

            const payload = {
                encryptData: arrayBufferToBase64(cipherText),
                tag: arrayBufferToBase64(tag),
                iv: arrayBufferToBase64(iv),
                exportedKey: JSON.stringify(exported)
            };
            console.log('\n\nPayload generated:', payload);

            fetch('http://localhost:8000/registration/auth/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            })
                .then(response => response.json())
                .then(token => {
                    console.log('Auth Token Received:', token);
                    console.log('Sending data to server');
                    fetch('http://localhost:8000/registration/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': token, 
                        },
                        body: JSON.stringify({
                            data: payload,
                        }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log('Success:', data);
                            console.log('Message:', data.msg);
                            console.log('Status:', data.status);
                            //success message show 
                            if(data.msg === "Duplicate Data"){
                                alert('You have already registered with this email id');
                                document.querySelector('form').reset();
                                   // redirect to hospisuite whats app bot 
                                // Delay the redirection by 2 seconds (2000 milliseconds)
                                setTimeout(() => {
                                    // Create an invisible link and trigger a click
                                   let link = document.createElement("a");
                                   link.href = "https://wa.me/918415082512";
                                   link.target = "_blank"; // Opens in a new tab
                                   document.body.appendChild(link);
                                   link.click();
                                    document.body.removeChild(link); // Clean up the DOM
                                }, 1000);
                                return;
                            }else if(data.msg === "Form submitted successfully"){
                                alert('Register Success!!\nThank you for registering with Hospisuite.\n\nRedirecting to Hospisuite WhatsApp Bot');
                                document.querySelector('form').reset();
                                // redirect to hospisuite whats app bot 
                                // Delay the redirection by 2 seconds (2000 milliseconds)
                                 setTimeout(() => {
                                   // Create an invisible link and trigger a click
                                  let link = document.createElement("a");
                                  link.href = "https://wa.me/918415082512";
                                  link.target = "_blank"; // Opens in a new tab
                                  document.body.appendChild(link);
                                  link.click();
                                   document.body.removeChild(link); // Clean up the DOM
                               }, 1000);
                            }else {
                                alert('Form submission failed. Please try again.');
                                document.querySelector('form').reset();
                                   // redirect to hospisuite whats app bot 
                                // Delay the redirection by 2 seconds (2000 milliseconds)
                                setTimeout(() => {
                                    // Create an invisible link and trigger a click
                                   let link = document.createElement("a");
                                   link.href = "https://wa.me/918415082512";
                                   link.target = "_blank"; // Opens in a new tab
                                   document.body.appendChild(link);
                                   link.click();
                                    document.body.removeChild(link); // Clean up the DOM
                                }, 1000);
                            }
                          
                        })
                        .catch(error => {
                            console.error('Error sending data:', error);
                        });
                })
                .catch(error => {
                    console.error('Error fetching token:', error);
                });
        } catch (error) {
            console.error('Encryption error:', error);
        }
    });

    function arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }
});