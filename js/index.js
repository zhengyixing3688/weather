$(function () {

  let currentIndex = 0;

  //保存天气数据
  let weatherData = {};

  //切换标签
  $('.title-item').on('click', function () {

    //获取下标
    let index = $(this).index();
    // console.log('index ==> ', index);

    //如果当前已经选中，则不做任何事情
    if (currentIndex == index) {
      console.log('当前已选中');
      return;
    }

    //获取html的font-size
    let fontSize = parseFloat($('html').css('font-size'));
    // console.log('fontSize ==> ', fontSize);

    //获取当前元素的宽度
    let currentWidth = $(this).width();
    // console.log('currentWidth ==> ', currentWidth);

    //如何将currentWidth转成rem值
    var distance = currentWidth / fontSize + 0.4;
    // console.log('distance ==> ', distance);

    //移动下划线
    $('.move-line').animate({
      left: index * distance + 'rem'
    }, 200);

    currentIndex = index;

    console.log('weatherData ==> ', weatherData);

    //获取data-type属性，方便动态获取天气数据
    let type = $(this).data('type');
    console.log(type);

    //获取天气数据
    var wdata = weatherData.HeWeather6[0][type];
    console.log('wdata ==> ', wdata);

    //获取逐日，逐小时天气数据
    dailyHourly(wdata, type);

  })

  //搜索
  $('.search-icon').on('click', function () {
    //获取输入的城市
    let city = $('.search-ipt').val();
    getWeatherByCity(city);
  })

  setBackground();

  //根据不同时间段设置不同背景
  function setBackground() {
    //获取时间
    let time = new Date().getHours();

    let $weatherBox = $('.weather-box');

    let t = '';
    
    if (time >= 6 && time < 12) {
      //添加morning
      t = 'morning';
    } else if (time >= 12 && time < 19) {
      //添加day
      t = 'day';
    } else {
      //添加night
      t = 'night';
    }

    $weatherBox.addClass(t);
  }

  //腾讯地图API定位, 获取城市天气
  function locationIP() {
    $.ajax({
      type: 'GET',
      url: 'https://apis.map.qq.com/ws/location/v1/ip',
      data: {
        key: 'RSMBZ-6LBCU-T2FVZ-BM7Z7-LKLEH-7TFFR',
        output: 'jsonp'
      },
      //响应数据类型
      dataType: 'jsonp',
      success: function (result) {
        console.log('result ==> ', result);

        //获取城市天气数据
        getWeatherByCity(result.result.ad_info.city);
      },
      error: function (err) {
        console.log('err ==> ', err);
      }
    })
  }

  //获取城市天气数据
  function getWeatherByCity(city) {

    if (city == '') {
      console.log('暂无天气数据');
      return;
    }

    //city: 城市
    $.ajax({
      type: 'GET',
      url: 'https://api.heweather.net/s6/weather',
      data: {
        location: city,
        key: '6e9ba463edd44e9f9e4020e87fad6c99'
      },
      success: function (result) {
        console.log('实况天气 result ==> ', result);
        //城市不存在
        if (result.HeWeather6[0].status == 'unknown location') {
          console.log('不存在该城市天气');
          return;
        }

        $('.location-text').text(city);
        $('.search-ipt').val('');

        weatherData = result;

        let weather = result.HeWeather6[0];

        $('.w').each(function () {
          //获取当前元素的id
          let id = $(this).attr('id');
          $(this).text(weather.now[id]);
        })

        //设置最低温和最高温
        let minTmp = weather.daily_forecast[0].tmp_min;
        let maxTmp = weather.daily_forecast[0].tmp_max;
        let tmpRange = `${minTmp}℃~${maxTmp}℃`
        $('#tmp-range').text(tmpRange);

        //获取分钟级降水
        getWeatherByMinute(weather.basic.lon, weather.basic.lat);

        //获取逐日天气数据
        dailyHourly(weather.daily_forecast, 'daily_forecast');

      },
      error: function (err) {
        console.log('err ==> ', err);
      }
    })
  }

  //获取分钟级降水
  function getWeatherByMinute(lon, lat) {
    console.log('lon ==> ', lon);
    console.log('lat ==> ', lat);
    //lon: 经度
    //lat: 纬度
    $.ajax({
      type: 'GET',
      url: 'https://api.heweather.net/s6/weather/grid-minute',
      data: {
        location: lon + ',' + lat,
        key: '6e9ba463edd44e9f9e4020e87fad6c99'
      },
      success: res => {
        console.log('分钟级降水 res ==> ', res);
        if (res.HeWeather6[0].grid_minute_forecast) {
          $('.preview').text(res.HeWeather6[0].grid_minute_forecast.txt);
        } else {
          $('.preview').text('暂无数据');
        }
        
      },
      error: err => {
        console.log('err ==> ', err);
      }
    })
  }

  //逐日,逐小时
  function dailyHourly(data, type) {

    //移除weather-list子元素
    $('.weather-list').empty();

    //data：逐日、逐小时天气数据， 类型：array
    for (let i = 0; i < data.length; i++) {
      let str = '';
      //逐日
      if (type == 'daily_forecast') {
        let date = data[i].date.slice(5);
        let tmp = `${data[i].tmp_min}℃~${data[i].tmp_max}℃`;
        str = `<div class="weather-item fl">
          <div class="date">
            <div>${date}</div>
            <div>${data[i].cond_txt_d}</div>
          </div>
          <div class="weather-icon">
            <img class="auto-img" src="./images/icons/${data[i].cond_code_d}.png" />
          </div>
          <div class="date">${tmp}</div>
        </div>`;
      } else {
        //逐小时
        let date = data[i].time.split(' ')[1];
        str = `<div class="weather-item fl">
          <div class="date">
            <div>${date}</div>
            <div>${data[i].cond_txt}</div>
          </div>
          <div class="weather-icon">
          <img class="auto-img" src="./images/icons/${data[i].cond_code}.png" />
          </div>
          <div class="date">${data[i].tmp}℃</div>
        </div>`;
      }
      

      $('.weather-list').append(str);

    }

    $('.weather-list').css({
      width: 0.8 * data.length + 'rem'
    })
  }

  locationIP();

})