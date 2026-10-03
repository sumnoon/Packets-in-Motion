// Reuse the authoring VM to inspect registrations without starting the player.
import {loadPage} from '../tests/harness.mjs';
export function courseCounts(html){
  const page=loadPage({html,seed:0}),chapters=page.get('chapters'),quizzes=Object.values(page.get('QUIZ'));
  const durations=chapters.map(c=>c.dur);
  return `${chapters.length} chapters in ${new Set(chapters.map(c=>c.group)).size} sections; ${Object.keys(page.get('LAB_DEFS')).length} architecture labs; ${quizzes.length} section quizzes. Lesson animations run ${Math.min(...durations)}–${Math.max(...durations)} seconds.\n\n| Section quiz | Questions |\n| --- | ---: |\n${quizzes.map(q=>`| ${q.group} | ${q.make.questions.length} |`).join('\n')}`;
}
export function countedReadme(readme,html){
  const pattern=/<!-- course-counts:start -->[\s\S]*?<!-- course-counts:end -->/;
  if(!pattern.test(readme))throw new Error('README course-counts markers are missing');
  return readme.replace(pattern,`<!-- course-counts:start -->\n${courseCounts(html)}\n<!-- course-counts:end -->`);
}
