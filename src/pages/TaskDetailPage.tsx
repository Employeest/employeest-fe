import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Task, TaskComment, TaskHistory, User } from '../types/apiTypes';
import { apiService } from '../services/apiService';
import { UserPlaceholderIcon } from '../components/icons';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) {
        setError("Task ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [taskData, commentsData, historyData, userData] = await Promise.all([
          apiService.tasks.getById(Number(taskId)),
          apiService.tasks.getComments(Number(taskId)),
          apiService.tasks.getHistory(Number(taskId)),
          apiService.auth.getProfile()
        ]);

        setTask(taskData);
        setComments(commentsData || []);
        setHistory(historyData || []);
        setCurrentUser(userData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch task data:", err);
        setError(err.message || "Failed to load task details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;
    setIsSubmittingComment(true);
    setError(null);
    try {
      const addedComment = await apiService.tasks.addComment(Number(taskId), { comment: newComment.trim() });
      setComments(prevComments => [addedComment, ...prevComments]);
      setNewComment('');
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      setError(err.message || "Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading task details...</div>;
  }

  const initialLoadError = error && !task;
  if (initialLoadError) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!task) {
    return <div className="p-8 text-center">Task not found.</div>;
  }

  return (
    <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
      <header className="mb-6 pb-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
            <div>
                <Link to={`/project/${task.project_id}`} className="text-sm text-indigo-600 hover:underline">{task.project_name}</Link>
                <h1 className="text-3xl font-semibold text-gray-800 mt-1">{task.name}</h1>
            </div>
        </div>
        {task.description && <p className="mt-2 text-gray-600 whitespace-pre-wrap">{task.description}</p>}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
                <span className="font-medium text-gray-500">Status: </span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                    task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                    task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'TODO' ? 'bg-gray-200 text-gray-800' :
                    'bg-red-100 text-red-800'}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            <div>
                <span className="font-medium text-gray-500">Priority: </span>
                <span className="text-gray-700">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            </div>
            {task.assignee && (
                <div>
                    <span className="font-medium text-gray-500">Assignee: </span>
                    <Link to={`/profile/${task.assignee.id}`} className="text-indigo-600 hover:underline">
                        {task.assignee.first_name && task.assignee.last_name ? `${task.assignee.first_name} ${task.assignee.last_name}` : task.assignee.username}
                    </Link>
                </div>
            )}
            {task.deadline && (
                <div>
                    <span className="font-medium text-gray-500">Deadline: </span>
                    <span className="text-gray-700">{new Date(task.deadline + 'T00:00:00').toLocaleDateString()}</span>
                </div>
            )}
             {task.story_points != null && (
                <div>
                    <span className="font-medium text-gray-500">Story Points: </span>
                    <span className="text-gray-700">{task.story_points}</span>
                </div>
            )}
            {task.estimation_hours != null && (
                <div>
                    <span className="font-medium text-gray-500">Est. Hours: </span>
                    <span className="text-gray-700">{task.estimation_hours}</span>
                </div>
            )}
            {task.parent_task && (
                 <div>
                    <span className="font-medium text-gray-500">Parent Task: </span>
                    <Link to={`/task/${task.parent_task.id}`} className="text-indigo-600 hover:underline">
                        {task.parent_task.name}
                    </Link>
                </div>
            )}
        </div>
      </header>

      {task.subtasks && task.subtasks.length > 0 && (
            <section className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Subtasks</h2>
                <div className="bg-white p-4 rounded-lg shadow">
                    <ul className="divide-y divide-gray-200">
                        {task.subtasks.map((sub: any) => (
                            <li key={sub.id} className="py-2">
                                 <Link to={`/task/${sub.id}`} className="text-sm text-indigo-600 hover:underline">{sub.name}</Link>
                                 <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                                    sub.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                 }`}>
                                     {sub.status}
                                 </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        )}


      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Comments ({comments.length})</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              disabled={isSubmittingComment}
            />
            {error && !isLoading && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isSubmittingComment || !newComment.trim()}
            >
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.length > 0 ? comments.map(comment => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center mb-1">
                  <UserPlaceholderIcon className="w-6 h-6 rounded-full mr-2" />
                  <span className="text-sm font-medium text-gray-800">
                    {comment.user.first_name && comment.user.last_name ? `${comment.user.first_name} ${comment.user.last_name}` : comment.user.username}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.comment}</p>
              </div>
            )) : <p className="text-sm text-gray-500">No comments yet.</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">History</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {history.length > 0 ? history.map(entry => (
              <li key={entry.id} className="text-xs text-gray-500 border-b border-gray-100 pb-1 last:border-b-0">
                <span className="font-medium text-gray-600">{entry.user ? (entry.user.first_name && entry.user.last_name ? `${entry.user.first_name} ${entry.user.last_name}` : entry.user.username) : 'System'}</span>: {entry.change_description}
                {entry.field_changed && <span className="text-gray-400"> ({entry.field_changed}: "{entry.old_value}" → "{entry.new_value}")</span>}
                <span className="float-right text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
              </li>
            )) : <p className="text-sm text-gray-500">No history for this task.</p>}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default TaskDetailPage;