import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export function GitHubLink() {
  return (
    <a
      className="github-link"
      href="https://github.com/CatsJuice/recorder.select"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub · Recorder Select"
      title="GitHub · Recorder Select"
    >
      <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
    </a>
  );
}
