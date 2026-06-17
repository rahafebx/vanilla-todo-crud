export function initCursor(dot) {
  const mouse = { x: 0, y: 0 };
  const dotPos = { x: 0, y: 0 };
  const ease = 0.05;
  let isMoving = false;

  function animateDot() {
    dotPos.x += (mouse.x - dotPos.x) * ease;
    dotPos.y += (mouse.y - dotPos.y) * ease;
    dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animateDot);
  }

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!isMoving) {
      dot.style.opacity = "1";
      isMoving = true;
    }
  });

  requestAnimationFrame(animateDot);

  window.addEventListener("mouseout", () => {
    dot.style.opacity = "0";
    isMoving = false;
  });
}
