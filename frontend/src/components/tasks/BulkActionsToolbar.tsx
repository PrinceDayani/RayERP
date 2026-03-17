import React, { useState } from 'react';
import { Trash2, UserPlus, Tag, Calendar, Copy, Archive, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useBulkOperations } from '@/hooks/tasks/useBulkOperations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface BulkActionsToolbarProps {
  selectedTaskIds: string[];
  onClearSelection: () => void;
  employees?: Array<{ _id: string; firstName: string; lastName: string }>;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedTaskIds,
  onClearSelection,
  employees = []
}) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [dueDate, setDueDate] = useState('');

  const {
    bulkDelete,
    bulkAssign,
    bulkStatus,
    bulkPriority,
    bulkAddTags,
    bulkSetDueDate,
    bulkClone,
    bulkArchive,
    isDeleting,
    isAssigning,
    isUpdatingStatus,
    isUpdatingPriority
  } = useBulkOperations();

  const handleBulkDelete = async () => {
    await bulkDelete(selectedTaskIds);
    setShowDeleteDialog(false);
    onClearSelection();
  };

  const handleBulkAssign = async () => {
    if (!selectedAssignee) return;
    await bulkAssign(selectedTaskIds, selectedAssignee);
    setShowAssignDialog(false);
    onClearSelection();
  };

  const handleBulkStatus = async () => {
    if (!selectedStatus) return;
    await bulkStatus(selectedTaskIds, selectedStatus);
    setShowStatusDialog(false);
    onClearSelection();
  };

  const handleBulkPriority = async () => {
    if (!selectedPriority) return;
    await bulkPriority(selectedTaskIds, selectedPriority);
    setShowPriorityDialog(false);
    onClearSelection();
  };

  const handleBulkAddTags = async () => {
    if (!tagName.trim()) return;
    await bulkAddTags(selectedTaskIds, [{ name: tagName.trim(), color: tagColor }]);
    setShowTagsDialog(false);
    setTagName('');
    onClearSelection();
  };

  const handleBulkSetDueDate = async () => {
    if (!dueDate) return;
    await bulkSetDueDate(selectedTaskIds, dueDate);
    setShowDueDateDialog(false);
    onClearSelection();
  };

  const handleBulkClone = async () => {
    await bulkClone(selectedTaskIds);
    onClearSelection();
  };

  const handleBulkArchive = async () => {
    await bulkArchive(selectedTaskIds);
    onClearSelection();
  };

  if (selectedTaskIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-4 flex items-center gap-3 z-50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedTaskIds.length} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <Button size="sm" variant="outline" onClick={() => setShowAssignDialog(true)}>
          <UserPlus className="h-4 w-4 mr-1" />
          Assign
        </Button>

        <Button size="sm" variant="outline" onClick={() => setShowStatusDialog(true)}>
          Status
        </Button>

        <Button size="sm" variant="outline" onClick={() => setShowPriorityDialog(true)}>
          Priority
        </Button>

        <Button size="sm" variant="outline" onClick={() => setShowTagsDialog(true)}>
          <Tag className="h-4 w-4 mr-1" />
          Tags
        </Button>

        <Button size="sm" variant="outline" onClick={() => setShowDueDateDialog(true)}>
          <Calendar className="h-4 w-4 mr-1" />
          Due Date
        </Button>

        <Button size="sm" variant="outline" onClick={handleBulkClone}>
          <Copy className="h-4 w-4 mr-1" />
          Clone
        </Button>

        <Button size="sm" variant="outline" onClick={handleBulkArchive}>
          <Archive className="h-4 w-4 mr-1" />
          Archive
        </Button>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>

        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Cancel
        </Button>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assign to</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssign} disabled={isAssigning || !selectedAssignee}>
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatus} disabled={isUpdatingStatus || !selectedStatus}>
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Priority</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkPriority} disabled={isUpdatingPriority || !selectedPriority}>
              {isUpdatingPriority ? 'Updating...' : 'Update Priority'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tag Name</Label>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g., urgent, bug, feature"
              />
            </div>
            <div>
              <Label>Tag Color</Label>
              <Input
                type="color"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddTags} disabled={!tagName.trim()}>
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Due Date Dialog */}
      <Dialog open={showDueDateDialog} onOpenChange={setShowDueDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Due Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDueDateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkSetDueDate} disabled={!dueDate}>
              Set Due Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTaskIds.length} task(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
