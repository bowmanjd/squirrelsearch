import { useState, useEffect, useRef } from 'react'
import './App.css'

function SearchTerm({index, term, target, waitTime, currentIndex, setCurrentIndex}) {
  const [status, setStatus] = useState('ready');
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
  const [currentIndex, setCurrentIndex] = useState(-1);
  const wakelock = useRef(null);

  useEffect(() => {
    fetchQueries(35).then(queries => {
      setTerms(queries.map((query, index) => {
        return {
          index: index,
          query: query,
          waitTime: Math.floor(Math.random() * 5000) + 8000,
          target: 'https://www.bing.com/search?form=MOZLBR&pc=MOZI&q=' + encodeURIComponent(query)
        } 
      }));
    });
  }, []);

  const onStart = () => {
    setCurrentIndex(0);
    checkLock();
  }

  const checkLock = async () => {
    if (currentIndex >= 0 && currentIndex < terms.length && wakelock.current === null && "wakeLock" in navigator) {
      wakelock.current = await navigator.wakeLock.request("screen");
      console.log('wakelocked');
      wakelock.current.addEventListener("release", () => {
        wakelock.current = null;
        console.log('wakelock released');
      });
    } else if (currentIndex >= terms.length && wakelock.current !== null) {
      wakelock.current.release().then(() => {
        wakelock.current = null;
        console.log('wakelock released finally');
      });
    }
  }

  checkLock();

  const listItems = terms.map(query => <li key={query.index}><SearchTerm index={query.index} target={query.target} term={query.query} waitTime={query.waitTime} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} /></li>);

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
