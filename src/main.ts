import './styles.css';
import { mount } from './ui/app';

const el = document.getElementById('app');
// Review mode is for Jim's edit pass. Nothing in the game links to it: it opens only with
// ?review=1 in the URL, and its code loads only then. A build made with VITE_NO_REVIEW=1
// (npm run package -- --public) leaves it out entirely.
const review = !import.meta.env.VITE_NO_REVIEW && new URLSearchParams(location.search).get('review') === '1';
if (el) {
  if (review) import('./review/review').then((m) => m.mountReview(el));
  else mount(el);
}
