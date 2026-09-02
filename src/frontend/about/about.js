document.addEventListener("DOMContentLoaded", () => {
    const sliderImages = document.querySelectorAll(".slider-img");

    sliderImages.forEach((image) => {
        image.addEventListener("mouseover", () => {
            sliderImages.forEach((img) => img.classList.remove("active"));
            image.classList.add("active");
        });
    });
});