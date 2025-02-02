import { useEffect, useRef, useState } from "react";
import Card from "./Card";
import Navigation from "./navigation";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

const Home = () => {
  const [cardwidth, setCardwidth] = useState(500);
  const cardsInRow = 5;
  const [wrapperwidth, setWrapperwidth] = useState(cardwidth * cardsInRow);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState("Popular");
  const [mousePos, setMousePos] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [loading, setLoading] = useState(false);

  const cardsRef = useRef(null);

  const getMousePositions = (e, referenceElement) => {
    const positions = {
      x: e.clientX,
      y: e.clientY,
    };

    const offset = {
      left: positions.x,
      top: positions.y,
      width: referenceElement.clientWidth,
      height: referenceElement.clientHeight,
    };

    setMousePos(offset);
    console.log(mousePos);
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  x.set(mousePos.left);
  y.set(mousePos.top);

  const xSpring = useSpring(x, { stiffness: 30, damping: 10 });
  const ySpring = useSpring(y, { stiffness: 15, damping: 10 });

  const translateX = useTransform(
    xSpring,
    [windowWidth * 0.12, windowWidth - windowWidth * 0.12],
    [0, -mousePos.width + windowWidth]
  );
  const translateY = useTransform(
    ySpring,
    [windowHeight * 0.1, windowHeight - windowHeight * 0.1],
    [0, -mousePos.height + windowHeight]
  );

  const apiKey = import.meta.env.VITE_API_KEY;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const getMovies = async () => {
      abortControllerRef.current != null && abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      setLoading(true);
      const url = `${baseUrl}/${group}?Page=${page}&Language=en-US&Adult=false`;
      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "tvshow.p.rapidapi.com",
        },
        signal:
          abortControllerRef.current != null &&
          abortControllerRef.current.signal,
      };

      try {
        const response = await fetch(url, options);
        const result = await response.json();
        setMovies(result);
        console.log(result);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Aborted");
          return;
        }
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getMovies();
  }, [page, group]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);

      let newCardWidth = 480;
      if (window.innerWidth < 1024) newCardWidth = 400;
      if (window.innerWidth < 768) newCardWidth = 280;

      setCardwidth(newCardWidth);
      setWrapperwidth(newCardWidth * cardsInRow);

      x.set(mousePos.left);
      y.set(mousePos.top);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [windowWidth, windowHeight]);

  return (
    <>
      <Navigation page={page} setPage={setPage} setGroup={setGroup} />

      {loading ? (
        <div className="h-screen w-screen flex justify-center items-center bg-[#240000] ">
          <h1 className="text-white text-4xl uppercase ">Loading...</h1>
        </div>
      ) : (
        <motion.div
          className=" flex justify-center  items-center fixed top-0 left-0 overflow-hidden"
          style={{ width: wrapperwidth, translateX, translateY }}
          ref={cardsRef}
          onMouseMove={(e) => getMousePositions(e, cardsRef.current)}
        >
          <div className=" flex flex-wrap ">
            {movies.map((movie, i) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: loading ? 0 : 1 }}
                transition={{ delay: i * 0.05 }}
                key={i}
              >
                <Card movie={movie} cardwidth={cardwidth} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Home;
