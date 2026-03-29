import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's stuff
        </Link>
      </h1>

      <img
        src="/brynjar_and_sigmund.jpg"
        alt="Brynjar"
        className="w-64 rounded border border-gray-200 mb-8"
      />

      <p className="text-gray-700 mb-8">Hi, I'm Brynjar! I am a software engineer and hobby musician.</p>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Work Experience</h3>
      <ul className="text-gray-700 space-y-2 mb-8 text-sm">
        <li><span className="text-gray-400">1999–2002</span> · OZ · Software Engineer</li>
        <li><span className="text-gray-400">2002–2006</span> · Landmat · Software Engineer</li>
        <li><span className="text-gray-400">2007–Present</span> · Calidris, Sabre · Software Engineer</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Education</h3>
      <ul className="text-gray-700 space-y-2 mb-8 text-sm">
        <li><span className="text-gray-400">1992–1996</span> · University of Iceland · B.A. Psychology</li>
        <li><span className="text-gray-400">1997–1999</span> · Reykjavik University · Software Engineering Degree</li>
        <li><span className="text-gray-400">2008–2009</span> · Reykjavik University · B.S. Computer Science</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Links</h3>
      <ul className="text-sm space-y-2">
        <li>
          <a href="mailto:breynisson@gmail.com" className="text-gray-700 hover:underline">
            breynisson@gmail.com
          </a>
        </li>
        <li>
          <a
            href="https://www.facebook.com/brynjar.reynisson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:underline"
          >
            Facebook
          </a>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/brynjar-reynisson-8011b72/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:underline"
          >
            LinkedIn
          </a>
        </li>
      </ul>
    </div>
  )
}
