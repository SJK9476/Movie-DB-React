import React, {useState, useEffect} from 'react';
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { useDebounce } from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';

// Keeps API key hidden in local ENV folder
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: `Bearer ${API_KEY}`
    }
}

const App = () => {

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [trendingMovies, setTrendingMovies] = useState([]);
    const [isTrendingLoading, setIsTrendingLoading] = useState(false);
    const [trendingErrorMessage, setTrendingErrorMessage] = useState('');

    // Debounced search term to make sure server isn't overloaded with requests
    // by using the debounce hook from react-use to delay new requests by 500ms

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 700, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);



            if (!response.ok) {
                throw new Error('Failed to fetch movies')
            }
            const data = await response.json();

            if (data.response === 'False') {
                setErrorMessage(data.error || 'Failed to fetch movies');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }

        } catch (error) {
            console.error(`Error fetching movies: ${error}`)
            setErrorMessage('Something went wrong. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        setIsTrendingLoading(true);
        setTrendingErrorMessage('');

        try {
            const movies =  await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (error) {
            console.log(`Error loading trending movies: ${error}`)
            setTrendingErrorMessage('Unable to load trending movies. Please' +
                ' try again later.');
        } finally {
            setIsTrendingLoading(false);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
        }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);


    return (
        <main>
            <div className="pattern"/>

            <div className="wrapper">
                <header>
                    <img src="/logo.png" alt="logo" className="w-[91px] h-[60px]"/>
                    <img src="/hero.png" alt="hero-banner" />
                    <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>

                        {isTrendingLoading ? (
                            <Spinner />
                        ) : trendingErrorMessage ? (
                            <p className="text-red-500">{trendingErrorMessage}</p>
                        ) : (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index + 1}</p>
                                        <img src={movie.poster_url} alt={movie.title}/>
                                    </li>
                                ))}
                            </ul>
                        )}


                    </section>
                )}
                <section className="all-movies">
                    <h2>All Movies</h2>

                    {isLoading ? (
                        <Spinner />
                    ): errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </main>
    );
};

export default App;
