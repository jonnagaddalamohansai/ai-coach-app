import { useState } from "react";
import { useSpeech } from "./useSpeech";
import { callApi } from "./api";

const FILLERS = /\b(um|uh|like|you know|basically|actually)\b/gi;

export default function App() {
  const [tab, setTab] = useState("coach"); // "coach" | "mock"
  const [profile, setProfile] = useState(localStorage.getItem("profile") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  // coach tab
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // mock tab
  const [mockQ, setMockQ] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn) => {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const ask = (q) => {
    if (!q) return;
    setQuestion(q);
    run(async () => setAnswer(await callApi({ mode: "answer", text: q, profile })));
  };

  const newMockQuestion = () =>
    run(async () => {
      const q = await callApi({ mode: "question", profile, role });
      setMockQ(q);
      setMyAnswer("");
      setFeedback("");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(q));
    });

  const getFeedback = () =>
    myAnswer &&
    run(async () => setFeedback(await callApi({ mode: "feedback", text: `Question: ${mockQ}\nAnswer: ${myAnswer}` })));

  const { start, stop, listening, interim } = useSpeech((t) => {
    if (tab === "coach") ask(t);
    else setMyAnswer((prev) => (prev + " " + t).trim());
  });

  const save = (key, setter) => (v) => {
    setter(v);
    localStorage.setItem(key, v);
  };

  const fillerCount = (myAnswer.match(FILLERS) || []).length;

  return (
    <div className="app">
      <h2>Voice Coach</h2>

      <textarea
        rows={3}
        placeholder="Your background: skills, experience, projects (saved on this device)"
        value={profile}
        onChange={(e) => save("profile", setProfile)(e.target.value)}
      />
      <input
        placeholder="Target role (for mock interview), e.g. Frontend Developer"
        value={role}
        onChange={(e) => save("role", setRole)(e.target.value)}
      />

      <div className="tabs">
        <button className={tab === "coach" ? "on" : ""} onClick={() => setTab("coach")}>
          Answer Coach
        </button>
        <button className={tab === "mock" ? "on" : ""} onClick={() => setTab("mock")}>
          Mock Interview
        </button>
      </div>

      <button className="mic" onClick={listening ? stop : start}>
        {listening ? "Stop listening" : "Start listening"}
      </button>
      {interim && <p className="interim">{interim}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p>Thinking...</p>}

      {tab === "coach" && (
        <>
          <input
            placeholder="Or type a question and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask(e.target.value);
                e.target.value = "";
              }
            }}
          />
          <h4>Question</h4>
          <p>{question}</p>
          <h4>Sample answer</h4>
          <p className="answer">{answer}</p>
        </>
      )}

      {tab === "mock" && (
        <>
          <button onClick={newMockQuestion}>New question</button>
          <h4>Interviewer asks</h4>
          <p>{mockQ}</p>
          <h4>Your answer (speak it or type it)</h4>
          <textarea rows={5} value={myAnswer} onChange={(e) => setMyAnswer(e.target.value)} />
          <p>Filler words: {fillerCount}</p>
          <button onClick={getFeedback}>Get feedback</button>
          <h4>Feedback</h4>
          <p className="answer">{feedback}</p>
        </>
      )}
    </div>
  );
}