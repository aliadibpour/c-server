import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-core';

@Injectable()
export class LiveMatchResultService {
  async liveResult() {
    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: false
    });
    const date = new Date();
    const days = [];
    
    for (let i = -2; i <= 5; i++) {
        const day = new Date(date);
        day.setDate(day.getDate() + i);
        days.push(day.toISOString().split("T")[0]);
    }
    
    let matchesResult = await Promise.all([
        this.renderPage(browser, this.evaluatePage, days[0]),
        this.renderPage(browser, this.evaluatePage, days[1]),
        this.renderPage(browser, this.evaluatePage, days[2]),
        this.renderPage(browser, this.evaluatePage, days[3]),
        this.renderPage(browser, this.evaluatePage, days[4]),
        this.renderPage(browser, this.evaluatePage, days[5]),
        this.renderPage(browser, this.evaluatePage, days[6]),
    ]);
    return matchesResult;
  }

  private renderPage = async (browser, evaluate, date) => {
    const url = "https://football360.ir/results";  
    const page = await browser.newPage();
    //await page.setViewport({width: 1080, height: 1024});
    page.setDefaultNavigationTimeout( 800000 );
    await page.goto(`${url}?day=${date}`);
    await page.waitForSelector('.Sections_container__03lu8');
    console.log('page load');
    const getDate = new Date();
    const getDate2 = new Date(getDate);
    const formatDate = getDate2.toISOString().split("T")[0];
    if (formatDate == date) return await page
    else {
        return await evaluate(page)
    }
  };

  private evaluatePage = async (page, todayPage) => {
    try {
      return await page.evaluate(async() => {
        const matches = Array.from(document.querySelectorAll('.Sections_container__03lu8'))
        return matches.map((product)=> {
          const league = product.querySelector('h2').innerHTML;
          const leagueImage = product.querySelectorAll('img')[0].src
          const matchList = Array.from(product.querySelectorAll('li'))
          .map((match) => {
            const score = match.querySelector('.style_match__Fiqcg');
            const homeTeam = match.querySelectorAll('.style_title__VxtR3')[0];
            const awayTeam = match.querySelectorAll('.style_title__VxtR3')[1];
            const teamImage = match.querySelectorAll('img');
            const homeTeamImage = teamImage[0].src
            const awayTeamImage = teamImage[1].src
            const matchFinish = match.querySelector('.style_date__t6_B6')
            const matchMinutes = match.querySelector('.style_live__7m2Y6 span')
            const matchMinutesAfter90 = match.querySelector('.style_live__7m2Y6')
            const matchCancel = match.querySelector('.style_canceled__RcO8s')
            const matchAdjournment = match.querySelector('.style_date__t6_B6')
            return {
                score: score ? score.innerHTML.split(':').reverse().join(':') : false,
                homeTeam: homeTeam.innerHTML || false,
                awayTeam: awayTeam.innerHTML || false,
                homeTeamImage: homeTeamImage || false,
                awayTeamImage: awayTeamImage || false,
                matchFinish: matchFinish ? matchFinish.innerHTML : false,
                matchMinutes: matchMinutes ? matchMinutes.innerHTML :  false,
                matchAdjournment: matchAdjournment ? matchAdjournment.innerHTML : false,
                matchCancel: matchCancel ? matchCancel.innerHTML : false,
                matchMinutesAfter90: matchMinutesAfter90 ? matchMinutesAfter90.innerHTML : false
            }
          })
          return {league, leagueImage, matchList}
        })
      })
    }
    finally {
      if (!todayPage) page.close()
    }
  }

}
