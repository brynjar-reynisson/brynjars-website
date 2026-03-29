import { Link } from 'react-router-dom'

export default function CircleOfFifths() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-1">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's Online Antics
        </Link>
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        <Link to="/vst-plugins" className="text-gray-400 no-underline hover:underline">
          ← VST Plugins
        </Link>
      </p>

      <img
        src="/circle5ths.gif"
        alt="Interactive Circle of Fifths"
        className="w-full rounded border border-gray-200 mb-8"
      />

      <h2 className="text-2xl font-bold text-gray-900 mb-3">Interactive Circle of Fifths</h2>
      <p className="text-gray-700 mb-8">
        A visual music theory tool that displays musical modes and chord information. Functions as both a standalone application and VST plugin, though it doesn't process audio or MIDI. The software replicates functionality from a physical device designed by Diego Merino, who also contributed significantly to its development.
      </p>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Features</h3>
      <ul className="text-gray-700 space-y-1 mb-8 list-disc list-inside">
        <li>Nine musical modes: Ionian (Major), Dorian, Phrygian, Lydian, Mixolydian, Eolian (Natural minor), Locrian, Harmonic minor, and Melodic minor</li>
        <li>Display notes only, notes with major chords, or notes with seventh chords</li>
        <li>CDE and DoReMi notation options</li>
        <li>Light and dark themes</li>
        <li>Full or half-circle display options</li>
        <li>Fully resizable interface</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Keyboard Controls</h3>
      <ul className="text-gray-700 space-y-1 mb-8 list-disc list-inside">
        <li>Left/Right arrow keys — rotate the circle</li>
        <li>Up/Down arrow keys — change modes</li>
        <li>Shift+Up/Down — toggle chord display</li>
      </ul>

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <p className="text-sm text-gray-500 mb-1">Windows 64-bit · Open source · Free</p>
        <a
          href="https://github.com/brynjar-reynisson/InteractiveCircleOfFifths/releases/download/v1.0.1/InteractiveCircleOfFifths.zip"
          className="text-sm font-semibold text-gray-900 hover:underline"
        >
          Download on GitHub →
        </a>
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Credits</h3>
      <ul className="text-gray-700 space-y-1 mb-8 text-sm">
        <li><span className="text-gray-500">Original device concept:</span> Diego Merino</li>
      </ul>

      <div className="text-xs text-gray-400 space-y-2">
        <p>Copyright (C) Brynjar Reynisson</p>
        <p>THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.</p>
      </div>
    </div>
  )
}
