import { useState, useEffect, useRef } from 'react'
import { atom, useAtom } from 'jotai';
import './App.css'

const currentIdx = atom(-1);
const timerList = atom([]);

function SearchTerm({index, term, target, waitTime}) {
  const [status, setStatus] = useState('ready');
  const [currentIndex, setCurrentIndex] = useAtom(currentIdx);
  const timer = useRef(null);

  if (index === currentIndex && status === 'ready') {
    setStatus('pending');
    if (timer.current === null) {
      timer.current = setTimeout(() => {
        const win = window.open(target);
        setStatus('complete');
        setCurrentIndex(index + 1);
        setTimeout(() => {
          win.close();
        }, 3000);
      }, waitTime);
    }
  }

  return (
    <a id={'term' + index} className={status} target="_blank" href={target}>
      {term}
    </a>
  );
}

async function fetchQueries (quantity) {
  // https://www.bing.com/profile/history
  // queries = [...new Set(Array.from(document.querySelectorAll('.query-list__requery-link')).map((t) => { return t.text}))]
  const response = await fetch(`/queries.json`);
  const data = await response.json();
  const sorted = data.sort(() => 0.5 - Math.random());
  const subset = sorted.slice(0, quantity);
  return subset;
}

function TermsList() {
  const [terms, setTerms] = useState([]);
  const [currentIndex, setCurrentIndex] = useAtom(currentIdx);
  const wakelock = useRef(null);

  useEffect(() => {
    fetchQueries(35).then(queries => {
      setTerms(queries.map((query, index) => {
        return {
          index: index,
          query: query,
          waitTime: Math.floor(Math.random() * 5000) + 8000,
          target: 'https://www.bing.com/search?form=QBRE&q=' + encodeURIComponent(query)
        } 
      }));
    });
  }, []);

  const onStart = async () => {
    if ("wakeLock" in navigator) {
      wakelock.current = await navigator.wakeLock.request("screen");
    }
    setCurrentIndex(0);
  }

  if (currentIndex >= terms.length - 1 && wakelock.current !== null) {
    wakelock.current.release().then(() => {
      wakelock.current = null;
    });
  }

  const listItems = terms.map(query => <li key={query.index}><SearchTerm index={query.index} target={query.target} term={query.query} waitTime={query.waitTime} /></li>);

  return (
    <>
    <button onClick={onStart}>Start</button>
    <button>Stop</button>
    <ul>
      {listItems}
    </ul>
    </>
  )
}

function App() {
  return (
    <TermsList />
  )
}

export default App
