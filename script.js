const apiHost = 'https://api.themoviedb.org'
const imgHost = 'https://image.tmdb.org/t/p/w500'
const apiKey = '64584326799a5c3d105fb71b5dfa501c'

const searchForm = document.querySelector('#search-form')
const movie = document.querySelector('#movies')
const dateOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
}

getApiUrlMulti = (query) => {
    return `${apiHost}/3/search/multi?api_key=${apiKey}&language=ru-RU&page=1&include_adult=false&query=${query}`
}

getApiUrlTrend = () => {
    return `${apiHost}/3/trending/all/day?api_key=${apiKey}&language=ru-RU`
}
getApiUrlVideos = (id, type) => {
    return `${apiHost}/3/${type}/${id}/videos?api_key=${apiKey}&language=ru-RU`
}

alarmText = (text, className, hTag = 2) => {
    const tag = `h${hTag}`
    return `<${tag} class='col-12 text-center ${className}'>${text}</${tag}>`
}

textDanger = (text, hTag = 2) => {
    return alarmText(text, 'text-danger', hTag)
}

textInfo = (text, hTag = 2) => {
    return alarmText(text, 'text-info', hTag)
}

apiSearch = (event) => {
    event.preventDefault()
    const searchText = searchForm.querySelector('.form-control').value
    if (0 === searchText.trim().length) {
        movie.innerHTML = textDanger('Поле не должно быть пустым')
        return
    }
    movie.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="sr-only">Loading...</span>
        </div>
        `

    fetch(getApiUrlMulti(searchText))
        .then(value => {
            if (200 !== value.status) {
                return Promise.reject(value)
            }
            return value.json()
        })
        .then(output => {
            if (0 === output.results.length) {
                movie.innerHTML = textInfo('Ничего не найдено')
                return
            }
            let inner = createList(output.results)
            movie.innerHTML = `<div class="card-columns">${inner}</div>`
            addEventMediaClick()
        })
        .catch(reason => {
            movie.innerHTML = textDanger('Упс, что то пошло не так!!!')
            console.log(`Error: ${reason || reason.status} ${reason.statusText}`)
        })
}

apiTrending = (event) => {
    fetch(getApiUrlTrend())
        .then(value => {
            if (200 !== value.status) {
                return Promise.reject(value)
            }
            return value.json()
        })
        .then(output => {
            if (0 === output.results.length) {
                movie.innerHTML = textInfo('Ничего не найдено')
                return
            }
            let inner = createList(output.results)
            inner = ("" !== inner) ? textInfo('Популярные за неделю!', 4) + `<div class="card-columns">${inner}</div>` : ""
            movie.innerHTML = inner
            addEventMediaClick()

        })
        .catch(reason => {
            movie.innerHTML = textDanger('Упс, что то пошло не так...')
            console.log(`Error: ${reason || reason.status} ${reason.statusText}`)
        })
}

createList = (results) => {
    let inner = ''
    results.forEach(function (item) {
        let nameItem = item.name || item.title,
            mediaType = (undefined !== item.media_type) ? item.media_type : item.title ? 'movie' : 'tv',
            dataInfo = `data-id=${item.id} data-type=${mediaType}`

        let imgFile = (undefined === item.poster_path
                || (null === item.poster_path || "" === item.poster_path.trim())
            )
            ? "./img/no_poster.jpg"
            : `${imgHost}${item.poster_path}`,
            img = `<img src="${imgFile}" class="card-img-top" alt="${nameItem}">`


        let itemDate = (item.first_air_date || item.release_date),
            itemDateStr = (undefined !== itemDate && itemDate.trim() !== "")
                ? (new Date(Date.parse(itemDate))).toLocaleString("ru", dateOptions)
                : '&nbsp;'

        inner += `
                <div class="card" ${dataInfo}>
                    ${img}
                    <div class="card-body">
                        <h5 class="card-title">${nameItem}</h5>
                        <p class="card-text"><small class="text-muted">${itemDateStr}</small></p>
                    </div>
                </div>`
    })
    return inner
}

addEventMediaClick = () => {
    const media = movie.querySelectorAll('.card[data-id]')
    media.forEach(function (element) {
        element.style.cursor = 'pointer'
        element.addEventListener('click', showFullInfo)
    })
}

function showFullInfo(event) {
    let url
    switch (this.dataset.type) {
        case 'movie':
            url = `${apiHost}/3/movie/${this.dataset.id}?api_key=${apiKey}&language=ru-RU`
            break
        case 'tv':
            url = `${apiHost}/3/tv/${this.dataset.id}?api_key=${apiKey}&language=ru-RU`
            break
        default:
    }

    fetch(url)
        .then(value => {
            if (200 !== value.status) {
                return Promise.reject(value)
            }
            return value.json()
        })
        .then(output => {
            movie.innerHTML = `
            <div class="fullInfo row" data-id="${this.dataset.id}" data-type="${this.dataset.type}">
                ${createFullInfo(output, this.dataset.id, this.dataset.type)}
            </div>
            `
            getVideo(this.dataset.id, this.dataset.type)
        })
        .catch(reason => {
            movie.innerHTML = textDanger('Упс, что то пошло не так!!!')
            console.log(`Error: ${reason || reason.status} ${reason.statusText}`)
        })
}

createFullInfo = (item, id, type) => {
    let nameItem = item.name || item.title
    let imgFile = (undefined === item.poster_path
            || (null === item.poster_path || "" === item.poster_path.trim())
        )
        ? "./img/no_poster.jpg"
        : `${imgHost}${item.poster_path}`,
        img = `<img src="${imgFile}" class="card-img-top" alt="${nameItem}">`

    let itemDate = (item.first_air_date || item.release_date),
        itemDateStr = (undefined !== itemDate && itemDate.trim() !== "")
            ? (new Date(Date.parse(itemDate))).toLocaleString("ru", dateOptions)
            : '-'

    let genres = ''

    item.genres.forEach(function (item) {
        genres += `<span class="badge badge-primary">${item.name}</span> `
    })

    return `
        <h4 class="col-12 text-center text-info">${nameItem}</h4>
        <div class="col-4">
            ${img}
            ${(item.homepage) ? `<p class="text-center">
                                    <a href="${item.homepage}" target="_blank">Официальный сайт</a>
                                </p>` : ''}
            ${(item.imdb_id) ? `<p class="text-center">
                                    <a href="https://imdb.com/title/${item.imdb_id}" target="_blank">Страница на IMDB</a>
                                </p>` : ''}
        </div>
        <div class="col-8">
            <p>Рейтинг: ${item.vote_average}</p>
            <p>Статус: ${item.status}</p>
            <p>Премьера: ${itemDateStr}</p>
            <p>Жанры: ${genres}</p>
            ${(item.last_episode_to_air) ? `<p>Сезонов: ${item.number_of_seasons}<br/> Серий: ${item.number_of_episodes}</p>` : ''}
            ${("" !== item.overview.trim()) ? `
            <h4>Описание</h4>
            <p>${item.overview}</p>
            ` : ''}
            
            <div class="youtube"></div>
        </div>  
    `
}

getVideo = (id, type) => {
    let youtube = movie.querySelector('.youtube')
    fetch(getApiUrlVideos(id, type))
        .then(value => {
            if (200 !== value.status) {
                return Promise.reject(value)
            }
            return value.json()
        })
        .then(output => {
            if (0 === output.results.length) {
                return ''
            }
            let inner = `<h4>Трелеры</h4>`
            output.results.forEach(function (item) {
                inner += `<iframe width="560" height="315" src="https://www.youtube.com/embed/${item.key}" 
            frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen></iframe>`
            })
            youtube.innerHTML = inner
        })
        .catch(reason => {
            movie.innerHTML = textDanger('Упс, что то пошло не так!!!')
            console.log(`Error: ${reason || reason.status} ${reason.statusText}`)
        })
    return `${id}, ${type}`
}

searchForm.addEventListener('submit', apiSearch)
document.addEventListener('DOMContentLoaded', apiTrending)