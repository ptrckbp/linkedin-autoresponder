import axios from "axios";

const isProduction = process.env.NODE_ENV === "production";

// Configuration
const AUTO_RESPOND = true;
const OPENBOOK_ASK_ENDPOINT = "https://openbook.botpress.tools/question";
const OPENBOOK_QUESTIONS_ENDPOINT = "https://openbook.botpress.tools/history";
const LINKEDIN_COMPANY_ID = isProduction ? 27121841 : 81588930;
const LINKEDIN_AUTHOR_HREF = isProduction
? "https://www.linkedin.com/company/botpress/"
: "https://www.linkedin.com/company/jubjub-rockets/";
const OPENBOOK_MAX_CHARS = 250;
const GLOBAL_DELAY_MS = 0; // this wil delay all pause activations

// Timing for pauses. If you encounter some timing issues (bad internet), add some time in GLOBAL_DELAY
const ONLOAD_WAIT_MS = 1000;
const NO_NEW_RESPONSE_WAIT_MS = 3000;
const SHORT_WAIT_MS = 500; // for waiting for request actions
const MEDIUM_WAIT_MS = 1000; // for waiting for request actions (api call)

// if something is broken, it's possibly due to an update on LinkedIn
const UNANSWERED_COMMENT_SELECTOR =
"article.comments-comment-item:not(.comments-reply-item)";
const MORE_REPLIES_SELECTOR =
".comments-comments-list__load-more-comments-button.artdeco-button.artdeco-button--muted.artdeco-button--1.artdeco-button--tertiary.ember-view";
const LINK_TO_POSTER_SELECTOR = "a.comments-post-meta__actor-link";
const RESPOND_BUTTON_SELECTOR =
".comments-comment-social-bar__reply-action-button";
const RESPOND_INPUT_SELECTOR = ".comments-comment-item__main-content";
const RESPOND_SUBMIT_SELECTOR = "button.comments-comment-box__submit-button";
const REPLY_COUNTER_SELECTOR = ".comments-comment-social-bar__replies-count";

// just making sure the author_href is in the valid format
console.assert(
  new RegExp("(https://www.linkedin.com/company/)[^/]+/$").test(
    LINKEDIN_AUTHOR_HREF
    )
    );

const redirectIfWrongAccount = () => {
  const parsedUrl = new URL(window.location.href);
  const needsRedirect =
    parsedUrl.searchParams.get("actorCompanyId") != LINKEDIN_COMPANY_ID;
  if (needsRedirect) {
    parsedUrl.searchParams.append("actorCompanyId", LINKEDIN_COMPANY_ID);
    window.location.assign(parsedUrl.toString());
  }
};

const pause = (pauseTimeMs) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, pauseTimeMs + GLOBAL_DELAY_MS);
  });
};

const isPoster = (element) => {
  const aTag = element.querySelector(LINK_TO_POSTER_SELECTOR);
  if (!aTag) {
    return false;
  }
  const hrefFirstATag = aTag.href;
  return hrefFirstATag === LINKEDIN_AUTHOR_HREF;
};

const clickPrevReplies = async () => {
  const showMoreButton = document.querySelector(MORE_REPLIES_SELECTOR);

  if (showMoreButton === null) {
    return false;
  }

  showMoreButton.click();

  await pause(MEDIUM_WAIT_MS); // make sure content loads

  return true;
};

const checkReplies = (element) => {
  // check to make sure no responses
  const hasComments = !!element.querySelector(REPLY_COUNTER_SELECTOR);
  return hasComments;
};

const getFirstUnansweredPost = async () => {
  await pause(MEDIUM_WAIT_MS); // make sure everything loads

  const posts = document.querySelectorAll(UNANSWERED_COMMENT_SELECTOR);
  for (const post of posts) {
    // check to make sure not poster
    if (isPoster(post)) {
      continue;
    }

    if (checkReplies(post)) {
      continue;
    }

    return post;
  }

  const clicked = await clickPrevReplies();
  if (clicked) {
    return getFirstUnansweredPost();
  }

  return null;
};

const getOpenBookResponse = async (input) => {
  const { data } = await axios.post(OPENBOOK_ASK_ENDPOINT, {
    question: input,
  });
  const { question_id } = data;

  const awaitResponse = async (id) => {
    const { data } = await axios.get(OPENBOOK_QUESTIONS_ENDPOINT);
    const { last_questions } = data;

    const remoteResult = last_questions.find((last_question) => {
      return id === last_question.id;
    });

    if (!remoteResult) {
      await pause(MEDIUM_WAIT_MS);
      return awaitResponse(id);
    }
    return remoteResult.answer;
  };

  return awaitResponse(question_id);
};

const writeResponse = async (unansweredPost) => {
  // get question
  // write answer in block
  const replyButton = unansweredPost.querySelector(RESPOND_BUTTON_SELECTOR);

  replyButton.click();
  await pause(SHORT_WAIT_MS);
  // get content

  const textElement = unansweredPost.querySelector(RESPOND_INPUT_SELECTOR);

  const text = textElement.innerText;

  if (text.length > OPENBOOK_MAX_CHARS) {
    alert(
      `text length exceeds maximum of ${OPENBOOK_MAX_CHARS}. Do this one manually, or raise the limit, then refresh.`
    );
    return;
  }

  const openbookResponse = await getOpenBookResponse(text);

  const replyInput = document.activeElement;

  replyInput.innerHTML = "OpenBook says: " + openbookResponse;

  if (AUTO_RESPOND) {
    await pause(SHORT_WAIT_MS);
    const submitButton = unansweredPost.querySelector(RESPOND_SUBMIT_SELECTOR);
    submitButton.click();
    await pause(SHORT_WAIT_MS);
    location.reload();
  }
};

const main = async () => {
  redirectIfWrongAccount();
  const firstUnansweredPost = await getFirstUnansweredPost();

  if (firstUnansweredPost) {
    writeResponse(firstUnansweredPost);
  } else {
    console.log("no response, will reload");
    await pause(NO_NEW_RESPONSE_WAIT_MS);
    location.reload();
  }
};

window.onload = function () {
  setTimeout(main, ONLOAD_WAIT_MS);
};
