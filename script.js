const uploadInput = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const generateButton = document.getElementById('generate');
const shareLinkContainer = document.getElementById('shareLinkContainer');
const shareLink = document.getElementById('shareLink');
const copyLinkButton = document.getElementById('copyLinkButton');
const labelTypeSelect = document.getElementById('labelType');

function rotateImage(src) {
    let dst = new cv.Mat();
    cv.transpose(src, dst);
    cv.flip(dst, dst, 1);
    return dst;
}

function detectAndCrop(image) {
    let src = cv.imread(image);
    let gray = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, 50, 150);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let largestContour = null;
    let maxArea = 0;
    for (let i = 0; i < contours.size(); i++) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        if (area > maxArea) {
            maxArea = area;
            largestContour = contour;
        }
    }

    if (largestContour !== null) {
        let rect = cv.boundingRect(largestContour);
        rect.height = Math.floor(rect.height / 2);
        rect.y = rect.y;

        let cropped = src.roi(rect);
        let rotatedCropped = rotateImage(cropped); 
        cv.imshow('canvas', rotatedCropped); 

        generateButton.style.display = 'block';

        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        src.delete();
        cropped.delete();
        rotatedCropped.delete();
    }
}

function detectAndCropVinted(image) {
    let src = cv.imread(image);
    let gray = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, 50, 150);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let largestContour = null;
    let maxArea = 0;
    for (let i = 0; i < contours.size(); i++) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        if (area > maxArea) {
            maxArea = area;
            largestContour = contour;
        }
    }

    if (largestContour !== null) {
        let rect = cv.boundingRect(largestContour);
        let cropped = src.roi(rect);

        // Additional cropping logic
        let newHeight = Math.floor(cropped.rows / 2); 
        let newWidth = Math.floor(cropped.cols * 0.5); 

        let finalCrop = cropped.roi(new cv.Rect(0, 0, newWidth, newHeight));

        cv.imshow('canvas', finalCrop); 

        generateButton.style.display = 'block';

        // Cleanup
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        src.delete();
        cropped.delete();
        finalCrop.delete();
    } else {
        alert("Bordereau non détecté");
    }
}


uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                if (labelTypeSelect.value === 'vinted') {
                    detectAndCropVinted(canvas); 
                } else {
                    detectAndCrop(canvas); 
                }
            }
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

generateButton.addEventListener('click', () => {
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'bordereau_recadre.png');

        fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID 03a82159b4bdd7c' 
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.link) {
                shareLink.value = data.data.link;
                copyLinkButton.style.display = 'block'; 
                shareLinkContainer.style.display = 'block'; 
            }
        })
        .catch(error => {
            console.error('Erreur lors du téléchargement de l\'image:', error);
        });
    }, 'image/png');
});

copyLinkButton.addEventListener('click', () => {
    shareLink.select();
    document.execCommand('copy');
    alert("Lien copié dans le presse-papiers !");
});
