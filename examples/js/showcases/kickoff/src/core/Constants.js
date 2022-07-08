export const MESSAGE = {
	RETURN_HOME: 'RETURN_HOME',
	PASS_TO_ME: 'PASS_TO_ME',
	RECEIVE_BALL: 'RECEIVE_BALL',
	SUPPORT_ATTACKER: 'SUPPORT_ATTACKER',
	GOAL_SCORED: 'GOAL_SCORED'
};
export const GOALKEEPER_STATES = {
	RETURN_HOME: 'RETURN_HOME',
	TEND_GOAL: 'TEND_GOAL',
	PUT_BALL_BACK_IN_PLAY: 'PUT_BALL_BACK_IN_PLAY',
	INTERCEPT_BALL: 'INTERCEPT_BALL'
};
export const FIELDPLAYER_STATES = {
	CHASE_BALL: 'CHASE_BALL',
	DRIBBLE: 'DRIBBLE',
	KICK_BALL: 'KICK_BALL',
	RECEIVE_BALL: 'RECEIVE_BALL',
	RETURN_HOME: 'RETURN_HOME',
	SUPPORT_ATTACKER: 'SUPPORT_ATTACKER',
	WAIT: 'WAIT'
};
export const TEAM_STATES = {
	ATTACKING: 'ATTACKING',
	DEFENDING: 'DEFENDING',
	PREPARE_FOR_KICKOFF: 'PREPARE_FOR_KICKOFF'
};
export const CONFIG = {
	GOALKEEPER_IN_TARGET_RANGE: 0.5, // the goalkeeper has to be this close to the ball to be able to interact with it
	GOALKEEPER_INTERCEPT_RANGE: 4, // when the ball becomes within this distance of the goalkeeper he changes state to intercept the ball
	GOALKEEPER_MIN_PASS_DISTANCE: 2, // // the minimum distance a player must be from the goalkeeper before it will pass the ball
	GOALKEEPER_TENDING_DISTANCE: 2, // this is the distance the keeper puts between the back of the net and the ball when using the interpose steering behavior
	PLAYER_CHANCE_OF_USING_ARRIVE_TYPE_RECEIVE_BEHAVIOR: 0.5, // this is the chance that a player will receive a pass using the "arrive" steering behavior, rather than "pursuit"
	PLAYER_CHANCE_ATTEMPT_POT_SHOT: 0.005, // the chance a player might take a random pot shot at the goal
	PLAYER_COMFORT_ZONE: 2.5, // when an opponents comes within this range the player will attempt to pass the ball. Players tend to pass more often, the higher the value
	PLAYER_IN_TARGET_RANGE: 0.25, // the player has to be this close to its steering target to be considered as arrived
	PLAYER_KICK_FREQUENCY: 1, // the number of times a player can kick the ball per second
	PLAYER_KICKING_RANGE: 0.3, // player has to be this close to the ball to be able to kick it
	PLAYER_MAX_DRIBBLE_AND_TURN_FORCE: 0.4, // the force used for dribbling while turning around
	PLAYER_MAX_DRIBBLE_FORCE: 0.6, // the force used for dribbling
	PLAYER_MAX_PASSING_FORCE: 3, // the force used for passing
	PLAYER_MAX_SHOOTING_FORCE: 4, // the force used for shooting at the goal
	PLAYER_MAX_SPEED_WITH_BALL: 0.8, // max speed with ball
	PLAYER_MAX_SPEED_WITHOUT_BALL: 1, // max speed without ball
	PLAYER_MIN_PASS_DISTANCE: 5, // the minimum distance a receiving player must be from the passing player
	PLAYER_NUM_ATTEMPTS_TO_FIND_VALID_STRIKE: 5, // the number of times the player attempts to find a valid shot
	PLAYER_RECEIVING_RANGE: 1, // how close the ball must be to a receiver before he starts chasing it
	PLAYER_PASS_INTERCEPT_SCALE: 0.3, // this value decreases the range of possible pass targets a player can reach "in time"
	PLAYER_PASS_REQUEST_SUCCESS: 0.1, // the likelihood that a pass request is successful
	PLAYER_PASS_THREAD_RADIUS: 3, // the radius in which a pass in dangerous
	SUPPORT_SPOT_CALCULATOR_SLICE_X: 12, // x dimension of spot
	SUPPORT_SPOT_CALCULATOR_SLICE_Y: 5, // y dimension of spot
	SUPPORT_SPOT_CALCULATOR_SCORE_CAN_PASS: 2, // score when pass is possible
	SUPPORT_SPOT_CALCULATOR_SCORE_CAN_SCORE: 1, // score when a goal is possible
	SUPPORT_SPOT_CALCULATOR_SCORE_DISTANCE: 2, // score for pass distance
	SUPPORT_SPOT_CALCULATOR_OPT_DISTANCE: 5, // optimal distance for a pass
	SUPPORT_SPOT_CALCULATOR_UPDATE_FREQUENCY: 1 // updates per second
};

export const TEAM = {
	RED: 0,
	BLUE: 1
};

export const ROLE = {
	GOALKEEPER: 0,
	ATTACKER: 1,
	DEFENDER: 2
};

CONFIG.GOALKEEPER_INTERCEPT_RANGE_SQ = CONFIG.GOALKEEPER_INTERCEPT_RANGE * CONFIG.GOALKEEPER_INTERCEPT_RANGE;
CONFIG.GOALKEEPER_IN_TARGET_RANGE_SQ = CONFIG.GOALKEEPER_IN_TARGET_RANGE * CONFIG.GOALKEEPER_IN_TARGET_RANGE;
CONFIG.PLAYER_COMFORT_ZONE_SQ = CONFIG.PLAYER_COMFORT_ZONE * CONFIG.PLAYER_COMFORT_ZONE;
CONFIG.PLAYER_IN_TARGET_RANGE_SQ = CONFIG.PLAYER_IN_TARGET_RANGE * CONFIG.PLAYER_IN_TARGET_RANGE;
CONFIG.PLAYER_KICKING_RANGE_SQ = CONFIG.PLAYER_KICKING_RANGE * CONFIG.PLAYER_KICKING_RANGE;
CONFIG.PLAYER_RECEIVING_RANGE_SQ = CONFIG.PLAYER_RECEIVING_RANGE * CONFIG.PLAYER_RECEIVING_RANGE;
