import type {
  CanvasAuthor,
  CanvasBranch,
  CanvasCommit,
  GitHubBranch,
  GitHubCommit,
} from '@git-canvas/shared/types';

/**
 * GitHubCommit を CanvasCommit に変換
 *
 * @param githubCommit - GitHub API から取得したコミット情報
 * @param branchNames - このコミットが属するブランチ名のリスト
 * @returns UIレンダリング用に最適化されたコミット情報
 */
export function convertToCanvasCommit(
  githubCommit: GitHubCommit,
  branchNames: string[] = []
): CanvasCommit {
  const { sha, commit, author, html_url, parents } = githubCommit;

  // コミットメッセージを1行目と全体に分割
  const messageParts = commit.message.split('\n');
  const message = messageParts[0] || '';
  const fullMessage = commit.message;

  // 短縮SHAを生成（最初の7文字）
  const shortId = sha.substring(0, 7);

  // 作成者情報を構築
  const canvasAuthor: CanvasAuthor = {
    name: commit.author.name,
    email: commit.author.email,
    avatarUrl: author?.avatar_url, // GitHub User情報がある場合のみ
  };

  // 親コミットのSHAリストを抽出
  const parentIds = parents.map((parent) => parent.sha);

  return {
    id: sha,
    shortId,
    message,
    fullMessage,
    date: new Date(commit.author.date),
    author: canvasAuthor,
    parentIds,
    branchNames,
    url: html_url,
  };
}

/**
 * GitHubBranch を CanvasBranch に変換
 *
 * @param githubBranch - GitHub API から取得したブランチ情報
 * @returns UIレンダリング用に最適化されたブランチ情報
 */
export function convertToCanvasBranch(githubBranch: GitHubBranch): CanvasBranch {
  return {
    name: githubBranch.name,
    latestCommitId: githubBranch.commit.sha,
    isProtected: githubBranch.protected,
    // color は UI側で自動生成するため、ここでは undefined
  };
}
