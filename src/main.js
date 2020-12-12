/* global data, google */
const timeRanges = {}
const refinedData = Object.values(data.members).map(member => {
  const completion = member.completion_day_level
  const star1Times = {}
  const star2Times = {}
  Object.keys(completion).forEach(day => {
    const star1Time = completion[day]['1']?.get_star_ts // eslint-disable-line camelcase
    const star2Time = completion[day]['2']?.get_star_ts // eslint-disable-line camelcase
    if (!timeRanges[day]) {
      timeRanges[day] = {
        star1MinTime: Number.MAX_SAFE_INTEGER,
        star1MaxTime: 0,
        star2MinTime: Number.MAX_SAFE_INTEGER,
        star2MaxTime: 0,
      }
    }
    if (!isNaN(star1Time)) {
      timeRanges[day].star1MinTime = Math.min(
        timeRanges[day].star1MinTime,
        parseInt(star1Time, 10)
      )
      timeRanges[day].star1MaxTime = Math.max(
        timeRanges[day].star1MaxTime,
        parseInt(star1Time, 10)
      )
      star1Times[day] = star1Time
    }
    if (!isNaN(star2Time)) {
      timeRanges[day].star2MinTime = Math.min(
        timeRanges[day].star2MinTime,
        parseInt(star2Time, 10)
      )
      timeRanges[day].star2MaxTime = Math.max(
        timeRanges[day].star2MaxTime,
        parseInt(star2Time, 10)
      )
      star2Times[day] = star2Time
    }
  })
  return {
    id: member.id,
    name: member.name,
    localScore: member.local_score,
    star1Times,
    star2Times,
  }
})

const sortedData = refinedData.sort((m1, m2) => m2.localScore - m1.localScore)

const colors = [
  '#3366cc',
  '#dc3912',
  '#ff9900',
  '#109618',
  '#990099',
  '#0099c6',
  '#dd4477',
  '#66aa00',
  '#b82e2e',
  '#316395',
  '#994499',
  '#22aa99',
  '#aaaa11',
  '#6633cc',
  '#e67300',
  '#8b0707',
  '#651067',
  '#329262',
  '#5574a6',
  '#3b3eac',
  '#b77322',
  '#16d620',
  '#b91383',
  '#f4359e',
  '#9c5935',
  '#a9c413',
  '#2a778d',
  '#668d1c',
  '#bea413',
  '#0c5922',
  '#743411',
]

function getTime (member, star, day) {
  return member['star' + star + 'Times'][day]
}

function pad (val) {
  return val < 10 ? '0' + val : val
}

function getTooltip (data, highlightedMember, star, day, startMillis) {
  const membersWithIndexes = data.map((member, i) => {
    return { ...member, index: i }
  })
  const membersWithTimes = membersWithIndexes.filter(member =>
    getTime(member, star, day)
  )
  const sortedMembers = membersWithTimes.sort(
    (m1, m2) => getTime(m1, star, day) - getTime(m2, star, day)
  )
  return (
    '<div style="width: 300px"><table>' +
    `<thead><th></th><th style="text-align: left">day ${day}</th><th>h</th><th>min</th><th>s</th></thead>` +
    '<tbody>' +
    sortedMembers
      .map(member => {
        const time = getTime(member, star, day)
        const totalSeconds = time ? Math.max(0, time - startMillis) : null
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds - hours * 3600) / 60)
        const seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60)
        const glowClass = highlightedMember.id === member.id ? 'glow' : ''
        return (
          '<div class="google-visualization-tooltip-item"><tr>' +
          `<td><div class="google-visualization-tooltip-square" style="background-color: ${
            colors[member.index]
          }"></div></td>` +
          `<td class="${glowClass}">` +
          member.name +
          '</td>' +
          `<td class="right ${glowClass}">` +
          (hours ? hours + ':' : '') +
          '</td>' +
          `<td class="right ${glowClass}">` +
          pad(minutes ? minutes + ':' : '') +
          '</td>' +
          `<td class="right ${glowClass}">` +
          pad(seconds) +
          '</td>' +
          '</tr>'
        )
      })
      .join('') +
    '</tbody></table></div>'
  )
}

const drawChart = (star, elementId) => () => {
  const data = new google.visualization.DataTable()
  data.addColumn({ type: 'string', id: 'Day' })
  sortedData.forEach(member => {
    data.addColumn('number', member.localScore + ' ' + member.name)
    data.addColumn({ type: 'string', role: 'tooltip', p: { html: true } })
  })

  Object.keys(timeRanges).forEach(day => {
    const timeRange = timeRanges[day]
    const start = new Date(timeRange.star1MinTime * 1000)
    start.setHours(7, 0, 0, 0)
    const startMillis = start.getTime() / 1000.0
    const times = []
    sortedData.forEach(member => {
      const time = getTime(member, star, day)
      const seconds = time ? Math.max(0, time - startMillis) : null
      times.push(seconds)
      const tooltip = getTooltip(sortedData, member, star, day, startMillis)
      times.push(tooltip)
    })
    const row = ['day ' + day, ...times]
    data.addRow(row)
  })
  const baseTextStyle = {
    color: '#cccccc',
    fontName: '"Source Code Pro", monospace',
    fontSize: 16,
  }
  const options = {
    titlePosition: 'none',
    height: 900,
    colors: colors,
    orientation: 'horizontal',
    curveType: 'function',
    lineWidth: 3,
    hAxis: { textStyle: baseTextStyle },
    vAxis: {
      scaleType: 'log',
      direction: -1,
      textStyle: baseTextStyle,
      format: '# s',
    },
    pointSize: 15,
    pointShape: 'star',
    backgroundColor: { fill: '#0f0f23' },
    chartArea: {
      width: '90%',
      height: '80%',
      backgroundColor: { fill: '#0f0f23' },
    },
    tooltip: {
      isHtml: true,
    },
    legend: {
      position: 'bottom',
      textStyle: baseTextStyle,
    },
  }

  const chart = new google.visualization.LineChart(
    document.getElementById(elementId)
  )
  chart.draw(data, options)
}

google.charts.load('current', { packages: ['corechart'] })
google.charts.setOnLoadCallback(drawChart(1, 'chart1'))
google.charts.setOnLoadCallback(drawChart(2, 'chart2'))
