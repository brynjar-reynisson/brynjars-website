import { Link } from 'react-router-dom'

export default function GrandStaff() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-1">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's stuff
        </Link>
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        <Link to="/vst-plugins" className="text-gray-400 no-underline hover:underline">
          ← VST Plugins
        </Link>
      </p>

      <img
        src="/grandstaff.png"
        alt="Grand Staff MIDI Visualizer"
        className="w-full rounded border border-gray-200 mb-8"
      />

      <h2 className="text-2xl font-bold text-gray-900 mb-3">Grand Staff MIDI Visualizer</h2>
      <p className="text-gray-700 mb-8">
        A VST plugin that visualizes MIDI notes as they play, with automatic chord name display when notes form chords.
      </p>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Features</h3>
      <ul className="text-gray-700 space-y-1 mb-8 list-disc list-inside">
        <li>Key signature selection with sharp/flat notation options</li>
        <li>Recognition of 1000+ chord patterns</li>
        <li>Octave transposition (±3 octaves)</li>
        <li>Full and short (American) notation modes</li>
        <li>Note-hold functionality</li>
        <li>Chord display options: below staff, right side, chords-only, or hidden</li>
        <li>Dark and light themes</li>
        <li>Bold and plain text modes for chords</li>
        <li>DAW automation support for all UI controls</li>
        <li>Fully resizable interface</li>
        <li>Note range: E1 to A6</li>
        <li>Verified by Pluginval</li>
      </ul>

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <p className="text-sm text-gray-500 mb-1">Windows 64-bit · Open source · Free</p>
        <a
          href="https://github.com/brynjar-reynisson/GrandStaffMIDIVisualizer/releases/download/v1.0/GrandStaffMIDIVisualizer.zip"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-900 hover:underline"
        >
          Download on GitHub →
        </a>
      </div>

      <p className="text-gray-700 mb-4">The following video of an older plugin version, shows key signature automation with a wide variety of chords being played.</p>
      <div className="mb-8 aspect-video">
        <iframe
          className="w-full h-full rounded border border-gray-200"
          src="https://www.youtube.com/embed/bGbAEzYub4s"
          title="Grand Staff MIDI Visualizer demonstration"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Credits</h3>
      <ul className="text-gray-700 space-y-1 mb-8 text-sm">
        <li><span className="text-gray-500">Concept, graphics &amp; chord list:</span> Diego Merino</li>
        <li><span className="text-gray-500">Demonstration video:</span> Matthijs Hebly</li>
        <li><span className="text-gray-500">Algorithm based on:</span> Chordback JSFX script by Paul Heams</li>
      </ul>

      <div className="text-xs text-gray-400 space-y-2">
        <p>Copyright (C) Brynjar Reynisson</p>
        <p>THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.</p>
      </div>
    </div>
  )
}
