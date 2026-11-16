import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const dateFormatTemplate = 'YYYY/MM/DD HH:mm';

export let timestampToString = (timestamp) => {
    const date = dayjs.unix(timestamp/1000);
    const formattedDate = date.format(dateFormatTemplate);
    return formattedDate;
}

export let timestampToDate = (timestamp) => {
    let dateInString = timestampToString(timestamp)
    return dayjs(dateInString, dateFormatTemplate)
}

// Tiempo transcurrido ("3 days ago"), la fecha completa se muestra en un tooltip (pauta 3.20)
export let timestampToTimeAgo = (timestamp) => {
    return dayjs(timestamp).fromNow()
}
