// /js/ui/sidebar.js
import { mountPublicComments } from './issoComments.js';
import { loadBlog } from '../feeds/blogLoader.js';

export function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
}

export function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
}

export function switchSection(sectionId) {
  closeSidebar();
  document.querySelectorAll('.mainSection').forEach(el => {
    el.classList.remove('active');
  });
  const section = document.getElementById(sectionId);
  section.classList.add('active');

  const params = new URLSearchParams(window.location.search);
  params.set('sidePanelSection', sectionId);
  history.replaceState(null, '', window.location.pathname + '?' + params.toString());

  if (sectionId === "commentSection") {
    mountPublicComments();
  } else if (sectionId === "blogSection" && !window.blogLoaded) {
    loadBlog();
  } else if (sectionId === "viewEvents" && window.rerenderEvents) {
    window.rerenderEvents();
  }
}
