// Used as least jquery as possible
const root = $('html, body');

// Browser support for beacon transport / GA
let beaconSupported = true;

if (!navigator.sendBeacon) {
    console.log("Beacon is NOT supported, disabling...");
    beaconSupported = false;
}

let gaEnabled = true;
if (typeof ga === "undefined") {
    console.log("Google analytics is disabled.");
    gaEnabled = false;
}

// ANIMATIONS
// These animations are not mine
// LICENSE: https://github.com/gdsmith/jquery.easing/blob/master/LICENSE
$.easing['jswing'] = $.easing['swing'];
$.extend($.easing, {
    easeOutQuart: function (x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
});

// Thanks SO
function throttle(fn, interval) {
    let lastCall, timeoutId;
    return function () {
        let now = new Date().getTime();
        if (lastCall && now < (lastCall + interval)) {
            // if we are inside the interval we wait
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function () {
                lastCall = now;
                fn.call();
            }, interval - (now - lastCall));
        } else {
            // otherwise, we directly call the function
            lastCall = now;
            fn.call();
        }
    };
}

function isOnPage(page) {
    return window.location.href.includes(page)
}

function isOnMainPage() {
    return typeof main_page !== "undefined";
}


function getScrollFromTop() {
    return (typeof window.pageYOffset !== "undefined") ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
}

if (isOnMainPage()) {
    const mainSections = document.querySelectorAll("section.track");

    // Animate scroll
    let animationLinks = document.querySelectorAll("a[href^='#']");

    animationLinks.forEach( function (item) {
        item.onclick = function (e) {
            e.preventDefault();

            let hash = this.hash;
            let target = $(hash);

            root.stop().animate({
                'scrollTop': target.offset().top
            }, 1250, "easeOutQuart", function () {
                window.location.hash = hash;
            });
        }
    });

    // Side buttons tracking
    // Layout: {id: circle_from_id}
    let trackedCircles = {};
    mainSections.forEach(function (item) {
        let id = item.getAttribute("id");
        let actual = document.querySelector("#side_nav a[track=" + id + "]");

        // Check if it exists
        if (actual !== null) {
            trackedCircles[id] = actual;
        }
    });

    // Light up the first one
    let firstCircle = document.querySelector("#side_nav a");
    firstCircle.classList.add("active");

    function makeOthersInactive(keep_thisone) {
        for (let a in trackedCircles) {
            if (trackedCircles[a] !== keep_thisone) {
                trackedCircles[a].classList.remove("active");
            }
        }
    }

    function sectionTracker() {
        let windowFromTop = getScrollFromTop();

        mainSections.forEach(function (el) {
            let th = $(el);

            let elFromTop = th.offset().top;
            let id = el.getAttribute("id");

            let tracked = trackedCircles[id];

            // Light up a different circle if user scrolled
            if (windowFromTop >= elFromTop) {
                makeOthersInactive(tracked);
                tracked.classList.add("active");
            }
        })
    }

    window.onscroll = throttle(sectionTracker, 200);

}

// All pages have navigation for mobile
const hamburger =  document.getElementById("ham"),
      mobileNavigation = document.getElementById("links");

hamburger.onclick = function () {
    mobileNavigation.classList.toggle("open");
};


if (isOnPage("commands.html")) {
    let commandSlides = document.querySelectorAll(".body__commands__container .cmd__category"),
        commandCategories = document.querySelectorAll(".cmd__switcher li");

    let trackedSlides = {};
    commandSlides.forEach(function (el) {
        let id = el.getAttribute("id");

        if (id !== null) {
            trackedSlides[id] = el;
        }
    });

    // Command slide tracker
    let group_to_button = {};
    commandCategories.forEach(function (el) {
        let slideName = el.getAttribute("slide");

        if (slideName !== null) {
            group_to_button[slideName] = el;
        }
    });

    function hideOtherSlides(keep_this) {
        for (let a in trackedSlides) {
            if (trackedSlides[a] !== keep_this) {
                trackedSlides[a].classList.remove("show");
            }
        }
    }

    function unActiveAllCategories(but_this) {
        for (let a in group_to_button) {
            if (group_to_button[a] !== but_this) {
                group_to_button[a].classList.remove("active");
            }
        }
    }

    // Change slides when a group is clicked
    commandCategories.forEach(function (el) {
        el.onclick = function (e) {
            e.preventDefault();

            let name = this.getAttribute("slide");
            let slide = trackedSlides[name];

            hideOtherSlides(slide);
            slide.classList.add("show");
            unActiveAllCategories(this);
            this.classList.add("active")
        }
    });

    // Check hash in url and redirect to that category
    if (window.location.hash) {
        let hash = window.location.hash.replace("#", "");

        let slide = group_to_button[hash];
        if (typeof slide !== "undefined") {
            // There is an element with such id, switch to it
            let one = trackedSlides[hash];
            hideOtherSlides(one);
            //slide.classList.add("show");
            unActiveAllCategories(slide);
            //this.classList.add("active")
            slide.classList.add("active");
            one.classList.add("show")

        }
    }

}
