// .button.show-prev-replies click all of them until no more

// article.comments-comment-item this is the selector for the comment boxes
// .comments-comment-social-bar__replies-count if has this as child, then ignore (already answered)
// a.reader-related-content__author-image.reader-related-content__footer-image-wrapper.ember-view to get href of author
// a.

// find first unanswered post

// get question

// feed question to openbook

// write response and wait.

// if no question set a 10s timeout then refresh

import axios from "axios";

const pause = (pauseTimeMs) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, pauseTimeMs);
  });
};
const getAuthorHref = async () => {
  const authorEl = document.querySelector(
    ".reader-related-content__author-image.reader-related-content__footer-image-wrapper.ember-view"
  );

  if (authorEl === null) {
    await pause(1000);
    return getAuthorHref();
  }

  return authorEl.href;
};

const isPoster = (element, authorHref) => {
  const hrefFirstATag = element.querySelector("a").href;
  return hrefFirstATag === authorHref;
};

const clickPrevReplies = async () => {
  const showMoreButton = document.querySelector(
    "button.show-prev-replies, button.comments-comments-list__load-more-comments-button"
  );
  console.log(
    "🚀 ~ file: contentScript.js ~ line 47 ~ clickPrevReplies ~ showMoreButton",
    showMoreButton
  );

  if (showMoreButton === null) {
    return false;
  }

  showMoreButton.click();

  await pause(2000); // make sure content loads

  return true;
};

const checkReplies = (element, authorHref) => {
  // check to make sure no responses
  const hasComments = !!element.querySelector(
    ".comments-comment-social-bar__replies-count"
  );
  if (hasComments) {
    return true;
  }
  // check if there is a following post for the author.

  let nextSibling = element.nextElementSibling;

  while (nextSibling) {
    console.log(nextSibling);
    if (isPoster(nextSibling, authorHref)) {
      return true;
    }
    nextSibling = nextSibling.nextElementSibling;
  }

  return false;
};

const getFirstUnansweredPost = async (authorHref) => {
  await pause(1000); // make sure everything loads

  const posts = document.querySelectorAll("article.comments-comment-item");
  for (const post of posts) {
    // check to make sure not poster
    if (isPoster(post, authorHref)) {
      continue;
    }

    // check to make sure no responses

    if (checkReplies(post, authorHref)) {
      continue;
    }
    return post;
  }

  const clicked = await clickPrevReplies();
  if (clicked) {
    return getFirstUnansweredPost(authorHref);
  }

  return null;
};

const getOpenBookResponse = async (input) => {
  const { data } = await axios.post(
    "https://openbook.botpress.tools/question",
    {
      question: input,
    }
  );
  const { question_id } = data;

  const awaitResponse = async (id) => {
    const { data } = await axios.get("https://openbook.botpress.tools/history");
    const { last_questions } = data;

    const remoteResult = last_questions.find((last_question) => {
      return id === last_question.id;
    });

    if (!remoteResult) {
      await pause(1000);
      return awaitResponse(id);
    }
    return remoteResult.answer;
  };

  return awaitResponse(question_id);
};
const writeResponse = async (unansweredPost) => {
  console.log(
    "🚀 ~ file: contentScript.js ~ line 77 ~ writeResponse ~ unansweredPost",
    unansweredPost
  );
  // get question
  // write answer in block
  const replyButton = unansweredPost.querySelector(
    ".comments-comment-social-bar__reply-action-button"
  );

  replyButton.click();
  await pause(400);
  // get content

  const textElement = unansweredPost.querySelector(
    ".comments-comment-item__main-content"
  );

  const text = textElement.innerText;

  const openbookResponse = await getOpenBookResponse(text);

  const replyInput = document.activeElement;
  console.log(
    "🚀 ~ file: contentScript.js ~ line 112 ~ writeResponse ~ replyInput",
    replyInput
  );
  replyInput.innerHTML = "OpenBook says: " + openbookResponse;
};

const main = async () => {
  const authorHref = await getAuthorHref();
  const firstUnansweredPost = await getFirstUnansweredPost(authorHref);

  if (firstUnansweredPost) {
    writeResponse(firstUnansweredPost);
  } else {
    console.log("no response, will reload");
    setTimeout(() => {
      location.reload();
    }, 10000);
  }
};

window.onload = function () {
  console.log("DOMContentLoaded");
  setTimeout(main, 1000);
};
