export const EVENT_TYPES = {
  src: 'SRC / School Government',
  class_rep: 'Class Representative',
  hall: 'Hall / Hostel',
  pageant: 'Pageant / Contest',
  custom: 'Custom Event',
};

export const EVENT_TYPE_COLORS = {
  src: 'badge-primary',
  class_rep: 'bg-accent-100 text-accent-700',
  hall: 'bg-amber-100 text-amber-700',
  pageant: 'bg-pink-100 text-pink-700',
  custom: 'badge-gray',
};

export const VOTING_TYPES = {
  free: 'Free Voting',
  paid: 'Paid Voting',
};

export const AUTH_METHODS = {
  student_id_pin: 'Student ID + PIN',
  voter_code: 'Voter Code',
};

export const ELECTION_STATUSES = {
  draft: { label: 'Draft', color: 'badge-gray' },
  active: { label: 'Active', color: 'badge-success' },
  paused: { label: 'Paused', color: 'badge-warning' },
  completed: { label: 'Completed', color: 'badge-primary' },
};
