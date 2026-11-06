export function updateVolumeIcon(button, value) {

  if (!button) return;

  if (value <= 0) {
    button.innerHTML =
      '<i data-lucide="volume-x"></i>';
  } else if (value < 0.5) {
    button.innerHTML =
      '<i data-lucide="volume-1"></i>';
  } else {
    button.innerHTML =
      '<i data-lucide="volume-2"></i>';
  }

  lucide.createIcons();
}